import bcrypt from "bcrypt";
import { Model } from "objection";
import BaseModel from "./baseModel.js";
import { Session } from "./session.js";

export class User extends BaseModel {
  static tableName = "users";

  id!: number;
  email!: string;
  password_digest!: string;
  password?: string;

  static get relationMappings() {
    return {
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: Session,
        join: {
          from: "users.id",
          to: "sessions.user_id",
        },
      },
    };
  }

  async $beforeInsert() {
    super.$beforeInsert();
    if (this.password) {
      this.password_digest = await bcrypt.hash(this.password, 10);
      delete this.password;
    }
  }

  async $beforeUpdate() {
    if (this.password) {
      this.password_digest = await bcrypt.hash(this.password, 10);
      delete this.password;
    }
  }

  // TODO: authentication inside of the model??
  static async authenticate(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await User.query().findOne({ email });
    if (user && (await bcrypt.compare(password, user.password_digest))) {
      return user;
    }
    return null;
  }
}
