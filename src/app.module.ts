import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

// Test queue processor
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

let redisURL: URL
let connection: { host: string; port: number; username: string; password: string; family: number; };
if (process.env.REDIS_URL) {
    redisURL = new URL(process.env.REDIS_URL);
    connection = {
        host: redisURL.hostname,
        port: Number(redisURL.port),
        username: redisURL.username,
        password: redisURL.password,
        family: 0,  // This allows both IPv4 and IPv6 connections
    }
    console.log(connection);
} else {
    console.log('Using default local Redis connection');
    redisURL = new URL('redis://localhost:6379');
}


@Processor('test-queue')
export class TestConsumer extends WorkerHost {
    async process(job: Job): Promise<any> {
        console.log('Processing job', job.id);
        return {};
    }
}

@Controller()
export class AppController {
    constructor(@InjectQueue('test-queue') private readonly testQueue: Queue) {}

    @Get()
    async addJob() {
        const job = await this.testQueue.add('test-job', { test: 'data' });
        return { jobId: job.id };
    }
}

@Module({
    imports: [
        BullModule.forRoot({
            connection: connection,
        }),
        BullModule.registerQueue({
            name: 'test-queue',
        }),
    ],
    controllers: [AppController],
    providers: [TestConsumer],
})
export class AppModule {}
