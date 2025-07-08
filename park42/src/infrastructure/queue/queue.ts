import { Queue } from "bullmq";
import { config } from "../../config.js";

export function makeQueue(name: string) {
  return new Queue(name, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    },
  });
}
