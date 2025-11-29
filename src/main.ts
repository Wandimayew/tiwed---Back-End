import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// import * as compression from 'compression';
import compression from 'compression'

import dns from 'dns';
import cookieParser from 'cookie-parser';


// Force Node.js to prefer IPv4 (fixes ENETUNREACH / ETIMEDOUT issues)
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middlewares
  app.use(helmet()); // secure HTTP headers
  app.use(compression()); // compress responses, helps slow networks

   app.use(cookieParser());
  // Enable CORS
app.enableCors({
  origin: [
    "http://localhost:3001",
    "http://192.168.1.2:3000", // if mobile testing
    "https://tiwed.com" // production
  ],
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Tiwed backend running on http://localhost:${port}`);
}

bootstrap();
