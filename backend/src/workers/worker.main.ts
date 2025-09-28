import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://aba.app', 'https://www.aba.app']
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });
  
  await app.listen(4000);
  console.log('🚀 ABA API running on port 4000');
}

bootstrap();
