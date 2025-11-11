import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with support for aliases
  const frontendAlias =
    process.env.FRONTEND_ALIAS || 'voto-inteligente.frontend.local';
  const frontendUrl = `http://${frontendAlias}:3000`;

  app.enableCors({
    origin: ['http://localhost:3000', frontendUrl],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Healthcheck endpoint
  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
