import "fastify";
import { Queue } from "bullmq";

declare module "fastify" {
  interface FastifyInstance {
    queue: Queue;
  }
}
