import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiKeyExpiry } from './create-api-key.dto';

export class RolloverApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  expired_key_id: string; // We expect the UUID of the expired key

  @IsEnum(ApiKeyExpiry)
  expiry: ApiKeyExpiry;
}