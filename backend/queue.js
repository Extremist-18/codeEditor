const { Queue } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
    host: process.env.REDIS_HOST || "redis",
    port: 6379,
    maxRetriesPerRequest: null
});

const judgeQueue = new Queue("judge-queue", { connection });
module.exports = { judgeQueue };
