import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevokeApiKeyDto {
  @ApiProperty({
    description: 'The UUID of the API key to be revoked.',
    example: 'z9y8x7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  key_id: string;
}