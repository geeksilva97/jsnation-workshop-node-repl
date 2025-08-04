import { Model } from "objection";
import BaseModel from "./baseModel.js";
import { User } from "./user.js";

export class ReservationModel extends BaseModel {
  static tableName = "reservations";

  id!: number;
  user_id!: number;
  price_token!: string;
  payment_token!: string;
  amount!: number;
  start_at!: Date;
  end_at!: Date;
  payment_status!: string;

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "reservations.user_id",
          to: "users.id",
        },
      },
    };
  }
}
