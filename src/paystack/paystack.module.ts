import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PaystackService } from './paystack.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: 'https://api.paystack.co',
        headers: {
          Authorization: `Bearer ${configService.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      }),
    }),
  ],
  providers: [PaystackService],
  exports: [PaystackService], // Export so other modules can use it
})
export class PaystackModule {}