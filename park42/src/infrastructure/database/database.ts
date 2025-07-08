import Knex from "knex";
import { config } from "../../config.js";
import BaseModel from "./models/baseModel.js";

export const makeDatabase = () => {
  const knex = Knex(config.db[config.env]);

  BaseModel.knex(knex);

  return {
    connection: knex,

    async connect(config = { log: true }) {
      await knex.raw("SELECT 1");
      if (config.log) {
        console.log("Database connected successfully.");
      }
    },

    async disconnect(config = { log: true }) {
      await knex.destroy();
      if (config.log) {
        console.log("Database disconnected successfully.");
      }
    },
  };
};
