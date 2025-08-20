import type { Transaction } from "objection";
import { ReservationModel } from "./database/models/reservation.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { NoAvailableSpotsError } from "../_lib/errors/no-available-spots-error.js";

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
  lockId: string,
  operation: () => Promise<TReturn>,
): Promise<TReturn> => {
  return await ReservationModel.transaction(async (trx) => {
    // await trx.raw("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
    await trx.raw("SELECT pg_advisory_xact_lock(?)", [hashString(lockId)]);
    return await transactionContext.run(trx, async () => {
      return await operation();
    });
  });
};

export const getCurrentTransaction = (): Transaction | undefined => {
  return transactionContext.getStore();
};
