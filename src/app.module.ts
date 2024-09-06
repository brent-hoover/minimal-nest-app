import { Module, OnModuleInit } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisPlugin } from './redis.plugin';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TestConsumer implements OnModuleInit {
    private readonly logger = new Logger(TestConsumer.name);
    private worker: Worker;

    constructor(private readonly redisPlugin: RedisPlugin) {}

    async onModuleInit() {
        const connection = this.redisPlugin.getQueue('test-queue')?.opts.connection;
        if (!connection) {
            this.logger.error('Redis connection not available');
            return;
        }

        this.worker = new Worker('test-queue', this.process.bind(this), { connection });
        this.worker.on('error', (error) => {
            this.logger.error('Worker error:', error);
        });
    }

    private async process(job: Job): Promise<any> {
        this.logger.log(`Processing job ${job.id}`);
        // Add your job processing logic here
        return {};
    }
}

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);

    constructor(private readonly redisPlugin: RedisPlugin) {}

    @Get()
    async addJob() {
        try {
            const job = await this.redisPlugin.addJob('test-queue', 'test-job', { test: 'data' });
            this.logger.log(`Job added with ID: ${job.id}`);
            return { jobId: job.id };
        } catch (error) {
            this.logger.error('Error adding job:', error);
            throw error;
        }
    }
}

@Module({
    imports: [],
    controllers: [AppController],
    providers: [RedisPlugin, TestConsumer],
})
export class AppModule {}
