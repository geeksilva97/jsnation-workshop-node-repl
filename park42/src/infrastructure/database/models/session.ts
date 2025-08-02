import crypto from "node:crypto";
import { Model } from "objection";
import BaseModel from "./baseModel.js";
import { User } from "./user.js";

export class Session extends BaseModel {
  static tableName = "sessions";

  id!: number;
  user_id!: number;
  token!: string;

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "sessions.user_id",
          to: "users.id",
        },
      },
    };
  }

  async $beforeInsert() {
    super.$beforeInsert();
    this.token = crypto.randomBytes(32).toString("hex");
  }
}
