import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKey } from './entities/api-key.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ConfigService } from '@nestjs/config';
import { RevokeApiKeyDto } from './dto/revoke-api-key.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, createApiKeyDto: CreateApiKeyDto) {
    // 1. Check if the user has reached the key limit
    const activeKeysCount = await this.apiKeyRepository.count({
      where: {
        userId: userId,
        revoked: false,
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException('You have reached the maximum number of active API keys.');
    }

    // 2. Generate a secure API key
    const rawApiKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;

    // 3. Hash the API key for secure storage
    const salt = await bcrypt.genSalt();
    const hashedApiKey = await bcrypt.hash(rawApiKey, salt);

    // 4. Calculate the expiry date
    const expiresAt = this.calculateExpiry(createApiKeyDto.expiry);

    // 5. Save the new key to the database
    const newApiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      key: hashedApiKey,
      userId: userId,
      expiresAt: expiresAt,
    });

    await this.apiKeyRepository.save(newApiKey);

    // 6. Return the raw key and expiry date to the user
    return {
        id: newApiKey.id,
        api_key: rawApiKey, // IMPORTANT: Only return the raw key once
        expires_at: expiresAt.toISOString(),
    };
  }

  private calculateExpiry(expiry: string): Date {
    const now = new Date();
    let dateToReturn: Date;

    switch (expiry) {
      case '1H':
        dateToReturn = new Date(now.setHours(now.getHours() + 1));
        break;
      case '1D':
        dateToReturn = new Date(now.setDate(now.getDate() + 1));
        break;
      case '1M':
        dateToReturn = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case '1Y':
        dateToReturn = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      default:
        // This should not happen due to DTO validation, but it's good practice
        throw new BadRequestException('Invalid expiry value');
    }

    // --- NEW: Enforce min/max lifetime ---
    const minExpiryHours = +this.configService.get<number>('API_KEY_MIN_EXPIRY_HOURS')!;
    const maxExpiryHours = +this.configService.get<number>('API_KEY_MAX_EXPIRY_HOURS')!;

    const minExpiryDate = new Date();
    minExpiryDate.setHours(minExpiryDate.getHours() + minExpiryHours);

    const maxExpiryDate = new Date();
    maxExpiryDate.setHours(maxExpiryDate.getHours() + maxExpiryHours);

    if (dateToReturn < minExpiryDate) {
      throw new BadRequestException(
        `Expiry is too short. Minimum is ${minExpiryHours} hour(s).`,
      );
    }

    if (dateToReturn > maxExpiryDate) {
      throw new BadRequestException(
        `Expiry is too long. Maximum is ${maxExpiryHours / 24} day(s). You requested an expiry beyond ${maxExpiryDate.toISOString()}.`,
      );
    }

    return dateToReturn;
  }

  async rollover(
    userId: string,
    rolloverDto: RolloverApiKeyDto,
  ): Promise<{ id: string; api_key: string; expires_at: string }> {
    const { expired_key_id, expiry } = rolloverDto;

    // 1. Find the old key, ensuring it belongs to the user
    const oldKey = await this.apiKeyRepository.findOne({
      where: { id: expired_key_id, userId: userId },
    });

    if (!oldKey) {
      throw new NotFoundException('The specified API key does not exist or you do not have permission to access it.');
    }

    // 2. Verify the key is actually expired
    if (oldKey.expiresAt > new Date()) {
      throw new BadRequestException('This key is not yet expired and cannot be rolled over.');
    }

    // 3. Reuse the same active key limit check from the 'create' method
    const activeKeysCount = await this.apiKeyRepository.count({
      where: {
        userId: userId,
        revoked: false,
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    if (activeKeysCount >= 5) {
      throw new ForbiddenException('You have reached the maximum number of active API keys.');
    }

    // 4. Generate and hash a new key
    const rawApiKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
    const salt = await bcrypt.genSalt();
    const hashedApiKey = await bcrypt.hash(rawApiKey, salt);
    const newExpiresAt = this.calculateExpiry(expiry);

    // 5. Create the new key, reusing permissions and name from the old key
    const newApiKey = this.apiKeyRepository.create({
      name: oldKey.name, // Reuse name
      permissions: oldKey.permissions, // Reuse permissions
      key: hashedApiKey,
      userId: userId,
      expiresAt: newExpiresAt,
    });

    await this.apiKeyRepository.save(newApiKey);
    
    // Optional: Mark the old key as revoked to prevent it from being rolled over again
    oldKey.revoked = true;
    await this.apiKeyRepository.save(oldKey);

    return {
        id: newApiKey.id,
      api_key: rawApiKey,
      expires_at: newExpiresAt.toISOString(),
    };
  }

   async revoke(userId: string, revokeDto: RevokeApiKeyDto): Promise<{ message: string }> {
    const { key_id } = revokeDto;

    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: key_id, userId: userId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found or you do not have permission to access it.');
    }

    apiKey.revoked = true;
    await this.apiKeyRepository.save(apiKey);

    return { message: `API key '${apiKey.name}' has been successfully revoked.` };
  }

  async validateApiKey(apiKey: string): Promise<{ user: User; permissions: string[] } | null> {
    // We cannot query the raw key directly. We need to find a way to check it.
    // A simple approach for this project: iterate through keys.
    // A production approach would use a more complex system.

    const allKeys = await this.apiKeyRepository.find({
      relations: ['user', 'user.wallet'], // Load the related user entity
      where: {
        revoked: false,
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    for (const key of allKeys) {
      const isMatch = await bcrypt.compare(apiKey, key.key);
      if (isMatch) {
        // Found a match. The key is valid.
        return { user: key.user, permissions: key.permissions };
      }
    }

    return null; // No valid key found
  }

}