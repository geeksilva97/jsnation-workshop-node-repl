import * as repl from "node:repl";
import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import models from "./infrastructure/database/models/index.js";

const database = makeDatabase();

const startREPL = async () => {
  const r = repl.start("jsnation> ");

  // TODO: Add the context variables here using Object.assign()
  // Include:
  // - name: "JSNation"
  // - config
  // - all models
  // Example: Object.assign(r.context, { name: "JSNation", config, ...models });

  // TODO: Define the .mycommand custom command
  // Use r.defineCommand() to define a command that:
  // - Prints "Hello Node REPL" using console.log()
  // - Calls this.displayPrompt() to show the prompt again

  r.on("exit", async () => {
    await database.disconnect();
    process.kill(process.pid, "SIGINT");
  });

  return r;
};

Promise.all([database.connect()])
  .then(async () => {
    startREPL();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
