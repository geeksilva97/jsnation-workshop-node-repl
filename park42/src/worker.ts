import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import { startReservationsExpireCronJob } from "./infrastructure/queue/reservation-expiration-cron.js";
import { startWorkers } from "./interface/workers/index.js";

const database = makeDatabase();

database
  .connect()
  .then(async () => {
    await startReservationsExpireCronJob(config.queues.default);
    startWorkers();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
