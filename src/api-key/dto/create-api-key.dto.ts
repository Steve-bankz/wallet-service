import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export enum ApiKeyPermission {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  READ = 'read',
}

export enum ApiKeyExpiry {
  HOUR = '1H',
  DAY = '1D',
  MONTH = '1M',
  YEAR = '1Y',
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsEnum(ApiKeyPermission, { each: true })
  permissions: ApiKeyPermission[];

  @IsEnum(ApiKeyExpiry)
  expiry: ApiKeyExpiry;
}