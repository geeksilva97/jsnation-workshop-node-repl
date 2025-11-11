import { test } from "node:test";
import { startConsole } from "../tests/support/index.js";

test("REPL exposes `name` variable with value JSNation", async (t) => {
  const { stdout } = await startConsole(["name"]);
  t.assert.match(stdout, /JSNation/);
});

test("REPL has command .mycommand that prints Hello Node REPL", async (t) => {
  const { stdout } = await startConsole([".mycommand"]);
  t.assert.match(stdout, /Hello Node REPL/);
});
