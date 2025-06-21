import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(`${process.env.PORT}`);
  });
}
bootstrap();
