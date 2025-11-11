import { spawn } from "node:child_process";
import path from "node:path";
import { test } from "node:test";

interface ConsoleResult {
  stdout: string;
}

function startConsole(commands: string[]): Promise<ConsoleResult> {
  return new Promise((resolve, reject) => {
    const consolePath = path.join(process.cwd(), "src", "console.ts");

    const child = spawn("npx", ["tsx", consolePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    // Write commands to stdin with small delays between them
    const commandsWithExit = [...commands, ".exit"];
    let commandIndex = 0;

    const writeNextCommand = () => {
      if (commandIndex < commandsWithExit.length) {
        const command = commandsWithExit[commandIndex];
        child.stdin.write(`${command}\n`);
        commandIndex++;
        // Add a small delay before writing the next command
        setTimeout(writeNextCommand, 100);
      } else {
        child.stdin.end();
      }
    };

    // Start writing commands after REPL is ready
    setTimeout(writeNextCommand, 300);

    child.on("exit", (code) => {
      // Exit code 130 (SIGINT) is expected when we send .exit
      if (code === 0 || code === 130 || code === null) {
        resolve({ stdout });
      } else {
        reject(new Error(`Console exited with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

test("REPL exposes `name` variable with value JSNation", async (t) => {
  const { stdout } = await startConsole(["name"]);
  t.assert.match(stdout, /JSNation/);
});

test("REPL has command .mycommand that prints Hello Node REPL", async (t) => {
  const { stdout } = await startConsole([".mycommand"]);
  t.assert.match(stdout, /Hello Node REPL/);
});
