import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import env from './config.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(env.PORT);
}
bootstrap();
