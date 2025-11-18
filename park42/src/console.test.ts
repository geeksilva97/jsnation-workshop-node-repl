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

test.skip("Sandbox mode rolls back changes when session closes", async (t) => {
  const uniqueEmail = `sandbox-test-${Date.now()}@example.com`;
  const assignEmailCommand = `const testEmail = "${uniqueEmail}"`;
  const createUserCommand = `await User.query().insert({ email: testEmail, password: "test123" })`;
  const countUsersCommand = `await User.query().where({ email: testEmail }).count()`;

  const { stdout } = await startConsole(
    [assignEmailCommand, createUserCommand, countUsersCommand],
    { sandbox: true },
  );

  // The count output should show 1 (user was created in the transaction)
  t.assert.match(
    stdout,
    /count.*1|1.*count/,
    "User should exist during sandbox session (count should be 1)",
  );

  const { stdout: checkStdout } = await startConsole([
    `const checkEmail = "${uniqueEmail}"; await User.query().where({ email: checkEmail }).count()`,
  ]);

  // The count should be 0 in a new session
  t.assert.match(
    checkStdout,
    /count.*0|0.*count/,
    "User should not exist in a new session (rollback should have occurred)",
  );
});
