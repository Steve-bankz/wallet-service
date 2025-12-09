import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(100) // Paystack has a minimum amount, usually 100 NGN/KES, 50 GHS etc.
  amount: number;
}