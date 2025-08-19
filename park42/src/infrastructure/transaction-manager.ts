import { type Transaction, transaction } from "objection";
import { ReservationModel } from "./database/models/reservation.js";
import { AsyncLocalStorage } from "node:async_hooks";

const transactionContext = new AsyncLocalStorage<Transaction>();

export class TransactionManager {
  static async run<TReturn>(
    operation: () => Promise<TReturn>,
  ): Promise<TReturn> {
    const trx = await transaction.start(ReservationModel.knex());

    try {
      return await transactionContext.run(trx, async () => {
        const result = await operation();
        await trx.commit();
        return result;
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Helper to get current transaction from context
  static getCurrentTransaction(): Transaction | undefined {
    return transactionContext.getStore();
  }
}
