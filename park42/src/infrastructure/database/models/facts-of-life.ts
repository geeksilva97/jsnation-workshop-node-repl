import BaseModel from "./baseModel.js";

export class FactOfLife extends BaseModel {
  static tableName = "facts_of_life";

  id!: number;
  question!: string;
  answer!: string;
}
