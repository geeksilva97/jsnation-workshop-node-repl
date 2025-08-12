import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import { makeServer } from "./interface/http/server.js";

const database = makeDatabase();
const defaultQueue = config.queues.default;

Promise.all([database.connect(), defaultQueue.waitUntilReady()])
  .then(async () => {
    const server = await makeServer({ queue: defaultQueue });

    await server.listen({ host: config.http.host, port: config.http.port });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
