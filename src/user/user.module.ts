import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { WalletModule } from '../wallet/wallet.module'; // Import WalletModule
import { Wallet } from '../wallet/entities/wallet.entity'; // Import Wallet entity

@Module({
 imports: [
   TypeOrmModule.forFeature([User, Wallet]), // Add Wallet entity
   forwardRef( () => WalletModule),
 ],
 providers: [UserService],
 exports: [UserService],
})
export class UserModule {}