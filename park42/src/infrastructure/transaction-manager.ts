import type { Transaction } from "objection";
import { ReservationModel } from "./database/models/reservation.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { NoAvailableSpotsError } from "../_lib/errors/no-available-spots-error.js";

const transactionContext = new AsyncLocalStorage<Transaction>();

export const run = async <TReturn>(
  operation: () => Promise<TReturn>,
): Promise<TReturn> => {
  try {
    return await ReservationModel.transaction(async (trx) => {
      await trx.raw("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      return await transactionContext.run(trx, async () => {
        return await operation();
      });
    });
  } catch (error) {
    const errorCode = (error as any).code || (error as any).nativeError?.code;
    if (errorCode === "40001") {
      throw NoAvailableSpotsError.create({
        message: "No available spots for the selected period",
        details: [error],
      });
    }

    throw error;
  }
};

export const getCurrentTransaction = (): Transaction | undefined => {
  return transactionContext.getStore();
};
