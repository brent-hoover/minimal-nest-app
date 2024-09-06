import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Job, Worker, QueueEvents } from 'bullmq';
import env from './config.js';

@Injectable()
export class RedisPlugin implements OnModuleInit, OnModuleDestroy {
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private queueEvents: Map<string, QueueEvents> = new Map();

    private getRedisConnection() {
        let connection: { host: string; port: number; username?: string; password?: string; family: number; };

        if (env.REDIS_URL) {
            console.log('Using REDIS_URL');
            const redisURL = new URL(env.REDIS_URL);
            connection = {
                host: redisURL.hostname,
                port: Number(redisURL.port),
                username: redisURL.username,
                password: redisURL.password,
                family: 0,  // This allows both IPv4 and IPv6 connections
            };
            console.log(connection);
        } else {
            console.log('Using default local Redis connection');
            connection = {
                host: 'localhost',
                port: 6379,
                family: 0,
            };
        }

        return connection;
    }

    async onModuleInit() {
        const connection = this.getRedisConnection();
        this.setupQueue('test-queue', connection);
    }

    async onModuleDestroy() {
        await Promise.all([...this.queues.values()].map(queue => queue.close()));
        await Promise.all([...this.workers.values()].map(worker => worker.close()));
        await Promise.all([...this.queueEvents.values()].map(queueEvent => queueEvent.close()));
    }

    private setupQueue(queueName: string, connection: any) {
        const queue = new Queue(queueName, { connection });
        this.queues.set(queueName, queue);

        const worker = new Worker(queueName, async (job: Job) => {
            console.log(`Processing job ${job.id} from queue ${queueName}`);
            // Add your job processing logic here
            return {};
        }, { connection });
        this.workers.set(queueName, worker);

        const queueEvents = new QueueEvents(queueName, { connection });
        this.queueEvents.set(queueName, queueEvents);

        queueEvents.on('completed', ({ jobId }) => {
            console.log(`Job ${jobId} has completed`);
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
            console.log(`Job ${jobId} has failed with reason: ${failedReason}`);
        });
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
