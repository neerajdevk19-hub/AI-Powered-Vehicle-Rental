import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) loadEnvFile(envPath);
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DriveAI - AI-Powered Vehicle Rental API')
    .setDescription(
      'REST APIs for DriveAI platform featuring LLM Tool Calling, RAG, Python AI Recommendation Service, and Live GPS WebSockets.',
    )
    .setVersion('1.0')
    .addTag('Vehicles')
    .addTag('Reservations')
    .addTag('AI Assistant')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 NestJS Backend running at http://localhost:${port}`);
  logger.log(`📚 Swagger API Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();
