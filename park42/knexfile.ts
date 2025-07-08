import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Knex } from "knex";

import { config } from "./src/config.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const commonConfig = {
  migrations: {
    directory: path.join(__dirname, "src/infrastructure/database/migrations"),
  },
  seeds: {
    directory: path.join(__dirname, "src/infrastructure/database/seeds"),
  },
};

type KnexConfig = Record<string, Knex.Config>;

const dbConfig = Object.entries(config.db).reduce<KnexConfig>(
  (knexConfig, [envName, envConfig]) => {
    knexConfig[envName] = {
      ...envConfig,
      ...commonConfig,
    };

    return knexConfig;
  },
  {},
);

export default dbConfig;
