const { Queue } = require('bullmq');

async function testConnection() {
    const connection = {
        host: 'localhost',
        port: 6379,
        username: 'myuser',
        password: 'mypassword',
        family: 0,
    };

    const queue = new Queue('test-queue', { connection });

    try {
        await queue.waitUntilReady();
        console.log('Connection successful');
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await queue.close();
    }
}

testConnection().catch(console.error);
