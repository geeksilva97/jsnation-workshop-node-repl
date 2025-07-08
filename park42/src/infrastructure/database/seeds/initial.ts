import type { Knex } from "knex";
import BaseModel from "../models/baseModel.js";
import { User } from "../models/user.js";

export async function seed(knex: Knex): Promise<void> {
  BaseModel.knex(knex);

  const emails = [
    "alice@email.com",
    "bob@email.com",
    "carol@email.com",
    "dave@email.com",
    "eve@email.com",
  ];

  for (const email of emails) {
    const existing = await User.query().findOne({ email });
    if (!existing) {
      await User.query().insert({ email, password: "password" });
    }
  }
}
