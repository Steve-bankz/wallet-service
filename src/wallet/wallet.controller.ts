import { Controller, Post, Body, Get, UseGuards, Param, Req, RawBody, Headers } from '@nestjs/common';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { WalletService } from './wallet.service';
import { TransferDto } from './dto/transfer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @Post('deposit')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Initiate a wallet deposit via Paystack' })
    @ApiBearerAuth()
    @ApiSecurity('Api-Key')
    @ApiResponse({ status: 201, description: 'Paystack transaction initialized successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    deposit(@Req() req, @Body() depositDto: DepositDto) {
        // req.user is populated by either JwtStrategy or ApiKeyStrategy
        return this.walletService.initiateDeposit(req.user, depositDto);
    }

    @Post('paystack/webhook')
    @ApiOperation({ summary: 'Paystack webhook for transaction events (For Paystack service use ONLY)' })
    @ApiResponse({ status: 201, description: 'Webhook received successfully.' })
    async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @RawBody() body: Buffer,
  ) {
    return this.walletService.processWebhook(signature, body);
  }

  @Post('transfer')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Transfer funds to another user wallet' })
    @ApiBearerAuth()
    @ApiSecurity('Api-Key')
    @ApiResponse({ status: 201, description: 'Transfer completed successfully.' })
    @ApiResponse({ status: 400, description: 'Bad request (e.g., insufficient balance, self-transfer).' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Recipient wallet not found.' })
    transfer(@Req() req, @Body() transferDto: TransferDto) {
        // req.user is populated by our unified guard (with user and wallet info)
        return this.walletService.transfer(req.user, transferDto);
    }

  @Get('balance')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Get the current wallet balance' })
    @ApiBearerAuth()
    @ApiSecurity('Api-Key')
    @ApiResponse({ status: 200, description: 'Returns the wallet balance.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getBalance(@Req() req) {
        // req.user is populated by our unified guard (with user and wallet info)
        return this.walletService.getBalance(req.user);
    }

  @Get('transactions')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Get the transaction history for the wallet' })
    @ApiBearerAuth()
    @ApiSecurity('Api-Key')
    @ApiResponse({ status: 200, description: 'Returns an array of transactions.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getTransactions(@Req() req) {
        return this.walletService.getTransactions(req.user);
    }

  @Get('deposit/:reference/status')
    @UseGuards(UnifiedAuthGuard)
    @ApiOperation({ summary: 'Manually check the status of a deposit' })
    @ApiBearerAuth()
    @ApiSecurity('Api-Key')
    @ApiResponse({ status: 200, description: 'Returns the status of the deposit.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Deposit transaction not found.' })
    getDepositStatus(@Req() req, @Param('reference') reference: string) {
        return this.walletService.getDepositStatus(req.user, reference);
    }
}