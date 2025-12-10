import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiKeyExpiry } from './create-api-key.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RolloverApiKeyDto {
   @ApiProperty({
    description: 'The UUID of the expired API key to be rolled over.',
    example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  expired_key_id: string; // We expect the UUID of the expired key


  @ApiProperty({
    description: 'The desired lifetime for the new key.',
    example: '1Y',
    enum: ApiKeyExpiry,
  })
  @IsEnum(ApiKeyExpiry)
  expiry: ApiKeyExpiry;
}