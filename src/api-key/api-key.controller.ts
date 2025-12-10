import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { RevokeApiKeyDto } from './dto/revoke-api-key.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('API Keys')
@ApiBearerAuth() 
@Controller('keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt')) // Protect this endpoint with our JWT strategy
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Maximum active API keys reached.' })
  create(
    @Req() req,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    // The `req.user` object is attached by the JwtStrategy's `validate` method
    const userId = req.user.id;
    return this.apiKeyService.create(userId, createApiKeyDto);
  }

  @Post('rollover')
  @UseGuards(AuthGuard('jwt')) // Also protected by JWT
  @ApiOperation({ summary: 'Rollover an expired API key' })
  @ApiResponse({ status: 201, description: 'API key rolled over successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Key is not yet expired.' })
  @ApiResponse({ status: 404, description: 'Expired key not found.' })
  rollover(
    @Req() req,
    @Body() rolloverDto: RolloverApiKeyDto,
  ) {
    const userId = req.user.id;
    return this.apiKeyService.rollover(userId, rolloverDto);
  }

  @Post('revoke')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Revoke an active API key' })
  @ApiResponse({ status: 201, description: 'API key revoked successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'API key not found.' })
  revoke(@Req() req, @Body() revokeDto: RevokeApiKeyDto) {
    const userId = req.user.id;
    return this.apiKeyService.revoke(userId, revokeDto);
  }
}