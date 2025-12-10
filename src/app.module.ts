import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { PaystackModule } from './paystack/paystack.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Check if the application is running in the production environment on Render
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get('DATABASE_URL');

        if (isProduction && databaseUrl) {
          // Production configuration for Render PostgreSQL
          return {
            type: 'postgres',
            url: databaseUrl, // Use the single connection URL from Render
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: false, // NEVER set to true in production
            ssl: true, // Render requires SSL connections
            extra: {
              ssl: {
                rejectUnauthorized: false, // Necessary for Render's managed database
              },
            },
          };
        }
        
        // Local development configuration (for Docker)
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST')!,
          port: +configService.get<number>('DB_PORT')!,
          username: configService.get<string>('DB_USERNAME')!,
          password: configService.get<string>('DB_PASSWORD')!,
          database: configService.get<string>('DB_NAME')!,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          // synchronize: true is fine for local dev to auto-create tables,
          // but we set it to false now to be consistent with our migration workflow.
          // Run your app with Docker and then run `npm run migration:run` locally too.
          synchronize: false,
        };
      },
    }),

    // --- Feature Modules ---
    AuthModule,
    UserModule,
    WalletModule,
    TransactionModule,
    ApiKeyModule,
    PaystackModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}