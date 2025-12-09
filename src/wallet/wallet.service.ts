import { Injectable, ForbiddenException, BadRequestException, Logger, NotFoundException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../transaction/entities/transaction.entity';
import { PaystackService } from '../paystack/paystack.service';
import { DepositDto } from './dto/deposit.dto';
import * as crypto from 'crypto';
import { Wallet } from './entities/wallet.entity';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        private readonly paystackService: PaystackService,
        private readonly dataSource: DataSource, // Inject DataSource
    ) {}

    async initiateDeposit(user: any, depositDto: DepositDto) {
        // Check for API Key permissions if applicable
        if (user.permissions && !user.permissions.includes('deposit')) {
            throw new ForbiddenException('You do not have permission to make a deposit.');
        }

        const reference = `deposit_${crypto.randomBytes(10).toString('hex')}`;
        const { amount } = depositDto;
        
        // The user object from the guard will have 'user' nested if from ApiKeyStrategy
        const authUser = user.user ? user.user : user;

        // 1. Create a pending transaction record
        const newTransaction = this.transactionRepository.create({
            amount: amount,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            reference: reference,
            description: 'Wallet deposit',
            walletId: authUser.wallet.id, // Assuming wallet is loaded on the user
        });
        await this.transactionRepository.save(newTransaction);
        
        // 2. Initialize Paystack transaction
        const paystackResponse = await this.paystackService.initializeTransaction(
            authUser.email,
            amount,
            reference,
        );
        
        return paystackResponse;
    }

    async processWebhook(signature: string, body: Buffer) {
    const isValid = this.paystackService.verifyWebhookSignature(signature, body);
    if (!isValid) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = JSON.parse(body.toString());

    // We only care about successful charges
    if (event.event !== 'charge.success') {
      this.logger.log(`Webhook received for non-success event: ${event.event}`);
      return { status: 'event not processed' };
    }

    const reference = event.data.reference;

    // Use a database transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the corresponding transaction in our DB
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { reference },
        relations: ['wallet'], // Load the wallet relation
      });

      if (!transaction) {
        // This could happen if the reference is wrong or transaction wasn't saved
        throw new BadRequestException(`Transaction with reference ${reference} not found.`);
      }

      // Idempotency check: If already successful, do nothing
      if (transaction.status === TransactionStatus.SUCCESS) {
        this.logger.log(`Transaction ${reference} has already been processed.`);
        await queryRunner.commitTransaction(); // Commit to end the transaction
        return { status: 'success' };
      }

      // 1. Update the transaction status
      transaction.status = TransactionStatus.SUCCESS;
      await queryRunner.manager.save(transaction);

      // 2. Credit the user's wallet
      const wallet = transaction.wallet;
      const newBalance = parseFloat(wallet.balance.toString()) + parseFloat(transaction.amount.toString());
      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();
      this.logger.log(`Wallet ${wallet.id} credited with ${transaction.amount}. New balance: ${newBalance}`);

      return { status: 'success' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Webhook processing failed for reference ${reference}`, error);
      throw new BadRequestException('Webhook processing failed');
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(sender: any, transferDto: TransferDto): Promise<{ message: string }> {
    const { amount, wallet_number } = transferDto;
    
    // 1. Authorization Check for API Keys
    if (sender.permissions && !sender.permissions.includes('transfer')) {
      throw new ForbiddenException('You do not have permission to perform a transfer.');
    }
    
    // The user object from the guard might be nested
    const senderUser = sender.user ? sender.user : sender;
    const senderWallet = senderUser.wallet;

    // 2. Prevent self-transfer
    if (senderWallet.walletNumber === wallet_number) {
      throw new BadRequestException('You cannot transfer funds to your own wallet.');
    }

    // 3. Start Atomic Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4. Find the recipient's wallet (and lock the row for the transaction)
      const recipientWallet = await queryRunner.manager.findOne(Wallet, {
        where: { walletNumber: wallet_number },
        lock: { mode: 'pessimistic_write' }, // Lock the row to prevent race conditions
      });

      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found.');
      }

      // 5. Check for sufficient funds
      if (senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance.');
      }
      
      // 6. Perform the balance updates
      const newSenderBalance = parseFloat(senderWallet.balance.toString()) - amount;
      senderWallet.balance = newSenderBalance;
      
      const newRecipientBalance = parseFloat(recipientWallet.balance.toString()) + amount;
      recipientWallet.balance = newRecipientBalance;
      
      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(recipientWallet);
      
      // 7. Record the transactions for both sender (debit) and recipient (credit)
      const senderTransaction = queryRunner.manager.create(Transaction, {
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        description: `Transfer to wallet ${recipientWallet.walletNumber}`,
        walletId: senderWallet.id,
      });

      const recipientTransaction = queryRunner.manager.create(Transaction, {
        amount,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.SUCCESS,
        description: `Received from wallet ${senderWallet.walletNumber}`,
        walletId: recipientWallet.id,
      });
      
      await queryRunner.manager.save([senderTransaction, recipientTransaction]);
      
      // 8. If all operations succeed, commit the transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Transfer successful: ${amount} from ${senderWallet.walletNumber} to ${recipientWallet.walletNumber}`);
      
      return { message: 'Transfer completed successfully' };
    } catch (error) {
      // 9. If any error occurs, roll back all changes
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transfer failed: ${error.message}`);
      // Re-throw the original error to be handled by NestJS
      throw error;
    } finally {
      // 10. Always release the query runner
      await queryRunner.release();
    }
  }

  async getBalance(user: any): Promise<{ balance: number }> {
    // 1. Authorization Check for API Keys
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException('You do not have permission to read wallet data.');
    }

    const authUser = user.user ? user.user : user;
    const wallet = authUser.wallet;

    return { balance: wallet.balance };
  }

   async getTransactions(user: any): Promise<Transaction[]> {
    // 1. Authorization Check for API Keys
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException('You do not have permission to read wallet data.');
    }

    const authUser = user.user ? user.user : user;
    const walletId = authUser.wallet.id;

    // 2. Find all transactions for the wallet, order by newest first
    const transactions = await this.transactionRepository.find({
        where: { walletId: walletId },
        order: { createdAt: 'DESC' },
    });

    return transactions;
  }

  async getDepositStatus(
    user: any,
    reference: string,
  ): Promise<{ reference: string; status: string; amount: number }> {
    // 1. Authorization Check for API Keys
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException('You do not have permission to read transaction data.');
    }
    
    const authUser = user.user ? user.user : user;
    const walletId = authUser.wallet.id;

    // 2. Find the transaction by reference, ensuring it belongs to the user's wallet
    const transaction = await this.transactionRepository.findOne({
        where: {
            reference: reference,
            walletId: walletId,
            type: TransactionType.DEPOSIT, // Ensure it's a deposit transaction
        },
    });

    if (!transaction) {
        throw new NotFoundException(`Deposit transaction with reference ${reference} not found.`);
    }

    return {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
    };
  }
}