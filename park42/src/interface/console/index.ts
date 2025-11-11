import type { Transaction } from "objection";
import models from "../../infrastructure/database/models/index.js";

export function bindModels(txn: Transaction) {
  const boundModels: Record<string, unknown> = {};

  for (const [key, Model] of Object.entries(models)) {
    boundModels[key] = Model.bindKnex(txn);
  }
  return boundModels as typeof models;
}
