import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { PaystackModule } from './paystack/paystack.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST')!, // Add ! here
        port: +configService.get<number>('DB_PORT')!, // Add ! here
        username: configService.get<string>('DB_USERNAME')!, // Add ! here
        password: configService.get<string>('DB_PASSWORD')!, // Add ! here
        database: configService.get<string>('DB_NAME')!, // Add ! here
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, 
      }),
    }),

    // --- Feature Modules ---
    AuthModule,
    UserModule,
    WalletModule,
    TransactionModule,
    ApiKeyModule,
    PaystackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}