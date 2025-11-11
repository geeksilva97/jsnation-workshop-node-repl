import repl from "node:repl";
import { config } from "./config.js";

// import { User } from "./infrastructure/database/models/user.js";

const startREPL = () => {
  const r = repl.start("jsnation> ");

  Object.assign(r.context, {
    name: "JSNation",
    config,
  });

  r.defineCommand("mycommand", {
    help: "Prints Hello Node REPL",
    action() {
      console.log("Hello Node REPL");
      this.displayPrompt();
    },
  });

  r.on("exit", () => {
    process.kill(process.pid, "SIGINT");
  });

  return r;
};

startREPL();
