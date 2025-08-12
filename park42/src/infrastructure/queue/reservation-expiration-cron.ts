import type { Queue } from "bullmq";

const EVERY_INTERVAL = 15 * 60_000;
const MAX_JOBS_TO_KEEP = 50;

export const startReservationsExpireCronJob = async (queue: Queue) => {
  await queue.upsertJobScheduler(
    "expire-reservations-schedule",
    {
      every: EVERY_INTERVAL,
    },
    {
      name: "expire-reservations-cron-job",
      opts: {
        removeOnComplete: MAX_JOBS_TO_KEEP,
      },
    },
  );
};
