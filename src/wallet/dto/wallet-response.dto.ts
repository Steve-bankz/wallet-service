import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({
    description: 'The unique wallet number for transfers.',
    example: '1234567890',
  })
  walletNumber: string;

  @ApiProperty({
    description: 'The current balance of the wallet.',
    example: 15000.0,
  })
  balance: number;
}