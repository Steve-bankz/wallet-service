import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: 'The unique wallet number of the recipient.',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  wallet_number: string;


  @ApiProperty({
    description: 'The amount to be transferred.',
    example: 3000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1) // Can't transfer zero or negative amounts
  amount: number;
}