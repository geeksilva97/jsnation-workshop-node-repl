import { Worker } from "bullmq";
import { config } from "../../config.js";
import { expireReservationsWorker } from "./expire-reservations-handler.js";

export const startWorkers = () => {
  new Worker(config.queues.default.name, expireReservationsWorker, {
    connection: {
      host: config.redis.host,
      port: config.redis.port,
    }
  });
};
