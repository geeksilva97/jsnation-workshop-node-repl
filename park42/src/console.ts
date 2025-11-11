import * as repl from "node:repl";
import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import models from "./infrastructure/database/models/index.js";
import { bindModels } from "./interface/console/index.js";

const database = makeDatabase();
const isSandbox = process.argv.includes("--sandbox");

const startREPL = async () => {
  const r = repl.start("jsnation> ");

  // Transaction is already created for sandbox mode
  const trx = isSandbox ? await database.connection.transaction() : null;

  // NOTE: If you wanted to bind models to the transaction (advanced feature),
  // you can use the bindModels(trx) function imported from "./interface/console/index.js"
  // For now, we'll just use the regular models.
  let m = models;

  // Add the context variables to the REPL
  Object.assign(r.context, {
    name: "JSNation",
    config,
    ...m,
  });

  r.defineCommand("mycommand", {
    help: "Prints Hello Node REPL",
    action() {
      console.log("Hello Node REPL");
      this.displayPrompt();
    },
  });

  r.on("exit", async () => {
    // TODO: Implement transaction rollback on REPL exit
    // When the user types .exit and we're in sandbox mode:
    // - Check: if (isSandbox && trx)
    // - Then: call await trx.rollback()
    // This discards all changes made during the REPL session
    //
    // Write your implementation here (uncomment the template below):
    // if (isSandbox && trx) {
    //   await trx.rollback();
    // }

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
