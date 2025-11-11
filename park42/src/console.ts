import * as repl from "node:repl";
import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import models from "./infrastructure/database/models/index.js";
import { bindModels } from "./interface/console/index.js";

const database = makeDatabase();
const isSandbox = process.argv.includes("--sandbox");

const startREPL = async () => {
  const r = repl.start("jsnation> ");
  const trx = isSandbox ? await database.connection.transaction() : null;
  let m = models;
  if (trx) {
    m = bindModels(trx);
  }

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
    if (isSandbox && trx) {
      await trx.rollback();
    }
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
