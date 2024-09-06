import { Module } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RedisPlugin } from './redis.plugin';

@Processor('test-queue')
export class TestConsumer extends WorkerHost {
    async process(job: Job): Promise<any> {
        console.log('Processing job', job.id);
        return {};
    }
}

@Controller()
export class AppController {
    constructor(private readonly redisPlugin: RedisPlugin) {}

    @Get()
    async addJob() {
        const job = await this.redisPlugin.addJob('test-queue', 'test-job', { test: 'data' });
        return { jobId: job.id };
    }
}

@Module({
    imports: [],
    controllers: [AppController],
    providers: [RedisPlugin, TestConsumer],
})
export class AppModule {}
