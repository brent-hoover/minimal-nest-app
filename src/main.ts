import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import env from './config';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        await app.listen(env.PORT);
        console.log(`Application is running on: http://localhost:${env.PORT}`);
    } catch (error) {
        console.error('Error starting the application:', error);
        process.exit(1);
    }
}
bootstrap();
