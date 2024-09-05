import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('test-queue')
export class TestConsumer {
    @Process()
    async transcode(job: Job<unknown>) {
        console.log('Processing job', job.id);
        return {};
    }
}

@Controller()
export class AppController {
    constructor(@InjectQueue('test-queue') private readonly testQueue: Queue) {}

    @Get()
    async addJob() {
        const job = await this.testQueue.add({ test: 'data' });
        return { jobId: job.id };
    }
}

@Module({
    imports: [
        BullModule.forRoot({
            redis: process.env.REDIS_URL,
        }),
        BullModule.registerQueue({
            name: 'test-queue',
        }),
    ],
    controllers: [AppController],
    providers: [TestConsumer],
})
export class AppModule {}
