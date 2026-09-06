import 'reflect-metadata';
import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { loadEnv } from '@mesi/config';

async function bootstrap() {
  const env = loadEnv();

  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'fatal'] });

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Graceful shutdown for Prisma
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks();

  await app.listen(env.PORT);
  // eslint-disable-next-line no-console
  console.log(`MESI API running on http://localhost:${env.PORT}/api`);
}

void bootstrap();
