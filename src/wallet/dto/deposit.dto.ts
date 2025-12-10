import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
   @ApiProperty({
    description: 'The amount to be deposited into the wallet.',
    example: 5000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(100) // Paystack has a minimum amount, usually 100 NGN/KES, 50 GHS etc.
  amount: number;
}