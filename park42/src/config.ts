import "dotenv/config";
import type { Knex } from "knex";
import { pino } from "pino";
import { Env, type EnvType } from "./_lib/env.js";
import { makePaymentService } from "./services/payment-api-service.js";
import { makeCreateReservationService } from "./services/create-reservation-service.js";

const env = Env.getString<EnvType>("NODE_ENV", "development");

const loggerConfig = {
  level: "debug",
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname",
    },
  },
};

const dbLogger = pino({ ...loggerConfig, level: "debug" });

const db = {
  development: {
    client: "postgresql",
    debug: true,
    log: {
      warn: (message) => dbLogger.warn(message, "Knex"),
      error: (message) => dbLogger.error(message, "Knex"),
      debug: (message) => dbLogger.debug(message, "Knex"),
      inspectionDepth: Number.POSITIVE_INFINITY,
      enableColors: true,
    },
    connection: {
      database: Env.getString("DATABASE_DB", "park42_development"),
      port: Env.getNumber("DATABASE_PORT", 5432),
      user: Env.getString("DATABASE_USER", "postgres"),
      password: Env.getString("DATABASE_PASSWORD", "postgres"),
      host: Env.getString("DATABASE_HOST", "127.0.0.1"),
    },
  } satisfies Knex.Config,
  test: {
    client: "postgresql",
    debug: false,
    connection: {
      database: Env.getString("TEST_DATABASE_DB", "park42_test"),
      port: Env.getNumber("TEST_DATABASE_PORT", 5432),
      user: Env.getString("TEST_DATABASE_USER", "postgres"),
      password: Env.getString("TEST_DATABASE_PASSWORD", "postgres"),
      host: Env.getString("TEST_DATABASE_HOST", "127.0.0.1"),
    },
  } satisfies Knex.Config,
} as const;

const redisHost = Env.getString("REDIS_HOST", "127.0.0.1");
const redisPort = Env.getNumber("REDIS_PORT", 6379);

const redis = {
  host: redisHost,
  port: redisPort,
  url: Env.getString("REDIS_URL", `redis://${redisHost}:${redisPort}`),
};

const http = {
  host: Env.getString("HOST", "0.0.0.0"),
  port: Env.getNumber("PORT", 3000),
  logger: {
    development: loggerConfig,
    production: true,
    test: false,
  },
};

const paymentService = makePaymentService({
  baseUrl: Env.getString("MOCK_API_URL", "http://localhost:4000"),
});

const maxMonthsInterval = Env.getNumber("MAX_MONTHS_INTERVAL", 3);

const secrets = {
  jwtSecret: Env.getString("JWT_SECRET", "park42-secret"),
  paymentApiSecret: Env.getString("PAYMENT_API_SECRET", "secret"),
};

const createReservationUseCase = makeCreateReservationService({
  maxMonths: maxMonthsInterval,
  paymentService,
});

export const config = {
  env,
  db,
  redis,
  http,
  createReservationUseCase,
  secrets,
};

export type Config = typeof config;
