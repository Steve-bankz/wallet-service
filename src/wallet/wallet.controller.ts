import { Controller, Post, Body, Get, UseGuards, Param, Req, ValidationPipe, RawBody, Headers } from '@nestjs/common';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import { DepositDto } from './dto/deposit.dto';
import { WalletService } from './wallet.service';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @Post('deposit')
    @UseGuards(UnifiedAuthGuard)
    deposit(@Req() req, @Body(new ValidationPipe()) depositDto: DepositDto) {
        // req.user is populated by either JwtStrategy or ApiKeyStrategy
        return this.walletService.initiateDeposit(req.user, depositDto);
    }

    @Post('paystack/webhook')
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @RawBody() body: Buffer,
  ) {
    return this.walletService.processWebhook(signature, body);
  }

  @Post('transfer')
    @UseGuards(UnifiedAuthGuard)
    transfer(@Req() req, @Body(new ValidationPipe()) transferDto: TransferDto) {
        // req.user is populated by our unified guard (with user and wallet info)
        return this.walletService.transfer(req.user, transferDto);
    }

  @Get('balance')
    @UseGuards(UnifiedAuthGuard)
    getBalance(@Req() req) {
        // req.user is populated by our unified guard (with user and wallet info)
        return this.walletService.getBalance(req.user);
    }

  @Get('transactions')
    @UseGuards(UnifiedAuthGuard)
    getTransactions(@Req() req) {
        return this.walletService.getTransactions(req.user);
    }

  @Get('deposit/:reference/status')
    @UseGuards(UnifiedAuthGuard)
    getDepositStatus(@Req() req, @Param('reference') reference: string) {
        return this.walletService.getDepositStatus(req.user, reference);
    }
}