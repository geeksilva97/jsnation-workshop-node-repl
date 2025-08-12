import type { Queue } from "bullmq";

const EVERY_MINUTE = 1 * 60_000;
const MAX_JOBS_TO_KEEP = 50;

export const startReservationsExpireCronJob = async (queue: Queue) => {
  await queue.upsertJobScheduler(
    "expire-reservations-schedule",
    {
      every: EVERY_MINUTE,
    },
    {
      name: "expire-reservations-cron-job",
      opts: {
        removeOnComplete: MAX_JOBS_TO_KEEP,
      },
    },
  );
};
