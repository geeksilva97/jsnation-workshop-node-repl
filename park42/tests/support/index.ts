import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Test } from "../../src/_lib/testSupport/setupTest.js";
import { User } from "../../src/infrastructure/database/models/user.js";

interface ConsoleResult {
  stdout: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startConsole(commands: string[]): Promise<ConsoleResult> {
  return new Promise((resolve, reject) => {
    const consolePath = path.resolve(__dirname, "../../src/console.ts");

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

    const commandsWithExit = [...commands, ".exit"];
    let commandIndex = 0;

    const writeNextCommand = () => {
      if (commandIndex < commandsWithExit.length) {
        const command = commandsWithExit[commandIndex];
        child.stdin.write(`${command}\n`);
        commandIndex++;
        // Small delay before writing the next command
        setTimeout(writeNextCommand, 100);
      } else {
        child.stdin.end();
      }
    };

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
