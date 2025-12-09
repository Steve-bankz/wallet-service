import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  wallet_number: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1) // Can't transfer zero or negative amounts
  amount: number;
}