import { Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "../../config.js";

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "park42",
  async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
