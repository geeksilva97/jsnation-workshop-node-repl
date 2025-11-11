import { spawn } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

function startConsole() {
  const consolePath = path.join(process.cwd(), "console.ts");

  const child = spawn("npx", ["tsx", consolePath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });

  return { child, stdoutRef: () => stdout };
}


test("REPL exposes `name` variable with value JSNation", (t, done) => {
  const { child, stdoutRef } = startConsole();

  // // Evaluate the variable in REPL
  child.stdin.write("name\n");
  child.stdin.write(".exit\n");

  child.on("exit", () => {
    const output = stdoutRef();

    t.assert.match(output, /JSNation/);
    done();
  });
});

test("REPL has command .mycommand that prints Hello Node REPL", (t, done) => {
  const { child, stdoutRef } = startConsole();

  child.stdin.write(".mycommand\n");
  child.stdin.write(".exit\n");

  child.on("exit", () => {
    const output = stdoutRef();

    t.assert.match(output, /Hello Node REPL/);
    done();
  });
});
