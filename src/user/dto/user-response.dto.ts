import { ApiProperty } from '@nestjs/swagger';
import { WalletResponseDto } from '../../wallet/dto/wallet-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: "The user's unique identifier.",
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  id: string;

  @ApiProperty({
    description: "The user's email address.",
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: "The user's full name.",
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'The user wallet details.',
  })
  wallet: WalletResponseDto;
}