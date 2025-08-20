import type { Transaction } from "objection";
import { ReservationModel } from "./database/models/reservation.js";
import { AsyncLocalStorage } from "node:async_hooks";

const transactionContext = new AsyncLocalStorage<Transaction>();

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export const run = async <TReturn>(
  lockIds: string[],
  operation: () => Promise<TReturn>,
): Promise<TReturn> => {
  return await ReservationModel.transaction(async (trx) => {
    const pgAdvisoryCalls = lockIds.map((lockId) => `pg_advisory_xact_lock(${hashString(lockId)})`);
    const query = `SELECT ${pgAdvisoryCalls.join(", ")}`;
    await trx.raw(query);

    return await transactionContext.run(trx, async () => {
      return await operation();
    });
  });
};

export const getCurrentTransaction = (): Transaction | undefined => {
  return transactionContext.getStore();
};
