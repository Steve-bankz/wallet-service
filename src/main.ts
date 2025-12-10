import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription('The complete API documentation for the NestJS Wallet Service.')
    .setVersion('1.0')
    .addTag('Auth', 'User Authentication')
    .addTag('API Keys', 'API Key Management')
    .addTag('Wallet', 'Wallet & Transaction Operations')
    .addBearerAuth() // For JWT
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'Api-Key') // For API Key
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
