import * as repl from "node:repl";
import { config } from "./config.js";
import { makeDatabase } from "./infrastructure/database/database.js";
import models from "./infrastructure/database/models/index.js";
import { bindModels } from "./interface/console/index.js";

const database = makeDatabase();

// TODO: Check if the console was started with the --sandbox flag
// Use: process.argv.includes("--sandbox")
// Store the result in a variable (e.g., isSandbox) for later use
// This will be used to determine if we should wrap queries in a transaction

const startREPL = async () => {
  const r = repl.start("jsnation> ");

  // TODO: Create a database transaction when sandbox mode is enabled
  // - If sandbox mode is enabled: create a transaction using database.connection.transaction()
  // - If not: set it to null
  // The transaction will ensure all database changes are rolled back when the session closes
  // Example: const trx = isSandbox ? await database.connection.transaction() : null;

  // TODO: Bind models to the transaction for sandbox mode
  // When in sandbox mode, queries should use the transaction instead of the regular connection.
  // Use the bindModels() function imported from "./interface/console/index.js"
  // This function takes a transaction and returns all models bound to it.
  // See: src/interface/console/index.ts for the implementation
  //
  // Logic:
  //   - Start with: let m = models;
  //   - If trx exists: m = bindModels(trx);
  //   - This ensures models use the transaction when in sandbox mode

  // Add the context variables to the REPL
  Object.assign(r.context, {
    name: "JSNation",
    config,
    // TODO: Use the bound models (m) here instead of the regular models
    // This ensures all User, Session, and ReservationModel queries use the transaction in sandbox mode
    ...models,
  });

  r.defineCommand("mycommand", {
    help: "Prints Hello Node REPL",
    action() {
      console.log("Hello Node REPL");
      this.displayPrompt();
    },
  });

  r.on("exit", async () => {
    // TODO: Handle transaction rollback on REPL exit
    // When the user types .exit:
    //   1. Check if we're in sandbox mode AND a transaction exists (if (isSandbox && trx))
    //   2. If yes: call await trx.rollback() to discard all changes
    //   3. Then disconnect from the database
    // This ensures all data modifications made during experimentation are rolled back
    // Example:
    //   if (isSandbox && trx) {
    //     await trx.rollback();
    //   }

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
