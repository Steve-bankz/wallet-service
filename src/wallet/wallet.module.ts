import { Module, forwardRef } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AuthModule } from '../auth/auth.module';
import { PaystackModule } from '../paystack/paystack.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';

@Module({
  imports: [
    forwardRef( () => AuthModule),
    PaystackModule,
    TypeOrmModule.forFeature([Transaction, Wallet]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}