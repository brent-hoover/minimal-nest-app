import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Worker, QueueEvents, Job, RedisOptions } from 'bullmq';
import env from './config.js';

@Injectable()
export class RedisPlugin implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisPlugin.name);
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private queueEvents: Map<string, QueueEvents> = new Map();

    private getRedisConnection(): RedisOptions {
        if (env.REDIS_URL) {
            this.logger.log('Using REDIS_URL');
            const redisURL = new URL(env.REDIS_URL);
            return {
                host: redisURL.hostname,
                port: Number(redisURL.port),
                username: redisURL.username,
                password: redisURL.password,
                family: 0,  // This allows both IPv4 and IPv6 connections
            };
        } else {
            this.logger.log('Using default local Redis connection');
            return {
                host: 'localhost',
                port: 6379,
                family: 0,
            };
        }
    }

    async onModuleInit() {
        try {
            this.logger.log('Initializing RedisPlugin');
            const connection = this.getRedisConnection();
            await this.setupQueue('test-queue', connection);
            this.logger.log('RedisPlugin initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize RedisPlugin', error.stack);
            throw error; // Rethrow to prevent app from starting if Redis is not available
        }
    }

    async onModuleDestroy() {
        this.logger.log('Cleaning up RedisPlugin resources');
        await Promise.all([...this.queues.values()].map(queue => queue.close()));
        await Promise.all([...this.workers.values()].map(worker => worker.close()));
        await Promise.all([...this.queueEvents.values()].map(queueEvent => queueEvent.close()));
        this.logger.log('RedisPlugin cleanup completed');
    }

    private async setupQueue(queueName: string, connection: RedisOptions) {
        this.logger.log(`Setting up queue: ${queueName}`);

        const queue = new Queue(queueName, { connection });
        this.queues.set(queueName, queue);

        const worker = new Worker(queueName, async (job: Job) => {
            this.logger.log(`Processing job ${job.id} from queue ${queueName}`);
            // Add your job processing logic here
            return {};
        }, { connection });
        this.workers.set(queueName, worker);

        const queueEvents = new QueueEvents(queueName, { connection });
        this.queueEvents.set(queueName, queueEvents);

        queue.on('error', (error) => {
            this.logger.error(`Queue error for ${queueName}:`, error);
        });

        worker.on('error', (error) => {
            this.logger.error(`Worker error for ${queueName}:`, error);
        });

        queueEvents.on('error', (error) => {
            this.logger.error(`QueueEvents error for ${queueName}:`, error);
        });

        try {
            await queue.waitUntilReady();
            this.logger.log(`Queue ${queueName} is ready`);
        } catch (error) {
            this.logger.error(`Error setting up queue ${queueName}:`, error);
            throw error;
        }
    }

    async addJob(queueName: string, jobName: string, data: any): Promise<Job> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        return await queue.add(jobName, data);
    }

    getQueue(queueName: string): Queue | undefined {
        return this.queues.get(queueName);
    }
}
