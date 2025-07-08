import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import { makeQueue } from "./infrastructure/queue/queue.js";
import { makeServer } from "./interface/http/server.js";

const database = makeDatabase();
const queue = makeQueue("park42");

Promise.all([database.connect(), queue.waitUntilReady()])
  .then(async () => {
    const server = await makeServer({ queue });

    await server.listen({ host: config.http.host, port: config.http.port });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
