import { clean } from "knex-cleaner";
import { makeDatabase } from "../../infrastructure/database/database.js";
import { makeQueue } from "../../infrastructure/queue/queue.js";
import { makeServer } from "../../interface/http/server.js";
import { config } from "../../config.js";

export const setupTest = async () => {
  const queue = makeQueue("test-queue", {
    host: config.redis.host,
    port: config.redis.port,
  });
  const server = await makeServer({ queue });
  const database = makeDatabase();

  await database.connect({ log: false });

  return {
    server,
    cleanDatabase: () => clean(database.connection),
    tearDown: () => database.disconnect({ log: false }),
    authenticate: async (input: { email: string; password: string }) => {
      const response = await server.inject({
        method: "POST",
        url: "/session",
        body: input,
      });

      return String(response.json().token);
    },
  };
};

export type Test = Awaited<ReturnType<typeof setupTest>>;
