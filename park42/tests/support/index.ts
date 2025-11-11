import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Test } from "../../src/_lib/testSupport/setupTest.js";
import { User } from "../../src/infrastructure/database/models/user.js";

interface ConsoleResult {
  stdout: string;
}

interface ConsoleOptions {
  sandbox?: boolean;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startConsole(
  commands: string[],
  options: ConsoleOptions = {},
): Promise<ConsoleResult> {
  return new Promise((resolve, reject) => {
    const consolePath = path.resolve(__dirname, "../../src/console.ts");

    const args = ["tsx", consolePath];
    if (options.sandbox) {
      args.push("--sandbox");
    }

    const child = spawn("npx", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let lastOutputLength = 0;

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    const commandsWithExit = [...commands, ".exit"];
    let commandIndex = 0;

    const writeNextCommand = () => {
      if (commandIndex < commandsWithExit.length) {
        const command = commandsWithExit[commandIndex];
        child.stdin.write(`${command}\n`);
        commandIndex++;

        // Wait for output to stabilize (indicating evaluation is done)
        let stabilityCheckCount = 0;
        const maxStabilityChecks = 100; // Max 5 seconds of checking
        const checkOutputStability = () => {
          stabilityCheckCount++;
          const currentLength = stdout.length;
          if (
            currentLength > lastOutputLength &&
            stabilityCheckCount < maxStabilityChecks
          ) {
            lastOutputLength = currentLength;
            // Wait a bit more to see if more output comes
            setTimeout(checkOutputStability, 50);
          } else {
            // Output has stabilized, move to next command
            setTimeout(writeNextCommand, 100);
          }
        };

        setTimeout(checkOutputStability, 100);
      } else {
        child.stdin.end();
      }
    };

    setTimeout(writeNextCommand, 1000);

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

export async function createPaymentToken(baseUrl = "http://localhost:4000") {
  const response = await fetch(`${baseUrl}/payment-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      card_number: "4111111111111111",
      cvv: "123",
      expiration: "11/29",
    }),
  });

  const data = (await response.json()) as { payment_token: string };
  return data.payment_token;
}

export const getUser = async (test: Test) => {
  const user = await User.query().insert({
    email: "user@example.com",
    password: "password",
  });
  const authToken = await test.authenticate({
    email: user.email,
    password: "password",
  });

  return {
    user,
    authToken,
  };
};
