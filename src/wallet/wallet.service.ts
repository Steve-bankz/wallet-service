import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction/entities/transaction.entity';
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
      throw new ForbiddenException(
        'You do not have permission to make a deposit.',
      );
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

    // SPECIFICATION MATCH: The Paystack response already contains `reference` and `authorization_url`, so this is correct.
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
      this.logger.log(
        `Webhook received for non-success event: ${event.event}`,
      );
      // SPECIFICATION MATCH: Return a simple object as per spec.
      // Paystack doesn't use this response, but we match the spec.
      return { status: true };
    }

    const reference = event.data.reference;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { reference },
        relations: ['wallet'],
      });

      if (!transaction) {
        throw new BadRequestException(
          `Transaction with reference ${reference} not found.`,
        );
      }

      if (transaction.status === TransactionStatus.SUCCESS) {
        this.logger.log(
          `Transaction ${reference} has already been processed.`,
        );
        await queryRunner.commitTransaction();
        // SPECIFICATION MATCH: Return the required format.
        return { status: true };
      }

      transaction.status = TransactionStatus.SUCCESS;
      await queryRunner.manager.save(transaction);

      const wallet = transaction.wallet;
      const newBalance =
        parseFloat(wallet.balance.toString()) +
        parseFloat(transaction.amount.toString());
      wallet.balance = newBalance;
      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();
      this.logger.log(
        `Wallet ${wallet.id} credited with ${transaction.amount}. New balance: ${newBalance}`,
      );

      // SPECIFICATION MATCH: Return { "status": true } on success.
      return { status: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Webhook processing failed for reference ${reference}`,
        error,
      );
      throw new BadRequestException('Webhook processing failed');
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(
    sender: any,
    transferDto: TransferDto,
  ): Promise<{ status: string; message: string }> { // <-- UPDATED return type
    const { amount, wallet_number } = transferDto;

    if (sender.permissions && !sender.permissions.includes('transfer')) {
      throw new ForbiddenException(
        'You do not have permission to perform a transfer.',
      );
    }

    const senderUser = sender.user ? sender.user : sender;
    const senderWallet = senderUser.wallet;

    if (senderWallet.walletNumber === wallet_number) {
      throw new BadRequestException(
        'You cannot transfer funds to your own wallet.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recipientWallet = await queryRunner.manager.findOne(Wallet, {
        where: { walletNumber: wallet_number },
        lock: { mode: 'pessimistic_write' },
      });

      if (!recipientWallet) {
        throw new NotFoundException('Recipient wallet not found.');
      }

      if (senderWallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      const newSenderBalance =
        parseFloat(senderWallet.balance.toString()) - amount;
      senderWallet.balance = newSenderBalance;

      const newRecipientBalance =
        parseFloat(recipientWallet.balance.toString()) + amount;
      recipientWallet.balance = newRecipientBalance;

      await queryRunner.manager.save(senderWallet);
      await queryRunner.manager.save(recipientWallet);

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

      await queryRunner.commitTransaction();

      this.logger.log(
        `Transfer successful: ${amount} from ${senderWallet.walletNumber} to ${recipientWallet.walletNumber}`,
      );

      // SPECIFICATION MATCH: Return the exact format required.
      return { status: 'success', message: 'Transfer completed' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Transfer failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBalance(user: any): Promise<{ balance: number }> {
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException(
        'You do not have permission to read wallet data.',
      );
    }

    const authUser = user.user ? user.user : user;
    const wallet = authUser.wallet;
    
    // SPECIFICATION MATCH: The spec and our code already match perfectly for this.
    return { balance: parseFloat(wallet.balance.toString()) };
  }

  async getTransactions(
    user: any,
  ): Promise<{ type: string; amount: number; status: string }[]> { // <-- UPDATED return type
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException(
        'You do not have permission to read wallet data.',
      );
    }

    const authUser = user.user ? user.user : user;
    const walletId = authUser.wallet.id;

    const transactions = await this.transactionRepository.find({
      where: { walletId: walletId },
      order: { createdAt: 'DESC' },
    });

    // SPECIFICATION MATCH: Map the full transaction entities to the specific format required.
    return transactions.map((tx) => ({
      type: tx.type,
      amount: parseFloat(tx.amount.toString()),
      status: tx.status,
    }));
  }

  async getDepositStatus(
    user: any,
    reference: string,
  ): Promise<{ reference: string; status: string; amount: number }> {
    if (user.permissions && !user.permissions.includes('read')) {
      throw new ForbiddenException(
        'You do not have permission to read transaction data.',
      );
    }

    const authUser = user.user ? user.user : user;
    const walletId = authUser.wallet.id;

    const transaction = await this.transactionRepository.findOne({
      where: {
        reference: reference,
        walletId: walletId,
        type: TransactionType.DEPOSIT,
      },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Deposit transaction with reference ${reference} not found.`,
      );
    }

    // SPECIFICATION MATCH: The spec and our code already match perfectly for this.
    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: parseFloat(transaction.amount.toString()),
    };
  }
}