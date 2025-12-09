import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
    private readonly paystackSecret: string;

    constructor(private readonly httpService: HttpService,
            private readonly configService: ConfigService,
  ) {
    this.paystackSecret = this.configService.get('PAYSTACK_SECRET_KEY')!;
  }

  async initializeTransaction(email: string, amount: number, reference: string) {
    const payload = {
      email,
      amount: amount * 100, // Paystack expects amount in the lowest currency unit (kobo/cents)
      reference,
    };
    const response = await firstValueFrom(
      this.httpService.post('/transaction/initialize', payload),
    );
    return response.data.data; // { authorization_url, access_code, reference }
  }

  verifyWebhookSignature(signature: string, body: Buffer): boolean {
    const hash = crypto
      .createHmac('sha512', this.paystackSecret)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}