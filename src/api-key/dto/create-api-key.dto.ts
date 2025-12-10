import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({
    description: 'A user-friendly name for the API key.',
    example: 'My New Service Key',
  })
  @IsString()
  @IsNotEmpty()
  name: string;


  @ApiProperty({
    description: 'The permissions to grant to this key.',
    example: ['deposit', 'read'],
    enum: ApiKeyPermission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ApiKeyPermission, { each: true })
  permissions: ApiKeyPermission[];


  @ApiProperty({
    description: 'The lifetime of the key (Hour, Day, Month, Year).',
    example: '1M',
    enum: ApiKeyExpiry,
  })
  @IsEnum(ApiKeyExpiry)
  expiry: ApiKeyExpiry;
}