import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RevokeApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  key_id: string;
}