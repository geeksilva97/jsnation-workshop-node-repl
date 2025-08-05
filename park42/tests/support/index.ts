import type { Test } from "../../src/_lib/testSupport/setupTest.js";
import { User } from "../../src/infrastructure/database/models/user.js";

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
