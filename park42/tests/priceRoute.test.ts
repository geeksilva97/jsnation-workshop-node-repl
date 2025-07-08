import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { decrypt } from "../src/_lib/priceToken.js";
import { setupTest, type Test } from "../src/_lib/testSupport/setupTest.js";
import { User } from "../src/infrastructure/database/models/user.js";

describe("POST /price", () => {
  let test: Test;

  beforeAll(async () => {
    test = await setupTest();
  });

  beforeEach(async () => {
    await test.cleanDatabase();
  });

  afterAll(async () => {
    await test.tearDown();
  });

  describe("when user is authenticated", () => {
    describe("when payload is valid", () => {
      it("returns the price and price token", async () => {
        const user = await User.query().insert({
          email: "user@example.com",
          password: "password",
        });
        const authToken = await test.authenticate({
          email: user.email,
          password: "password",
        });
        const startAt = new Date(Date.UTC(2025, 5, 1)).toISOString();
        const endAt = new Date(Date.UTC(2025, 5, 2)).toISOString();

        const response = await test.server.inject({
          method: "POST",
          url: "/price",
          headers: { Authorization: `Bearer ${authToken}` },
          payload: { start_at: startAt, end_at: endAt },
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.currency).toBe("BRL");
        expect(body.price).toBe(50000);
        const decryptedPriceToken = decrypt(body.price_token);
        expect(decryptedPriceToken).toEqual({
          start_at: startAt,
          end_at: endAt,
          price: 50000,
          currency: "BRL",
        });
      });

      describe("when payload is invalid", () => {
        it("returns 422 (unprocessable entity)", async () => {
          const user = await User.query().insert({
            email: "user2@example.com",
            password: "password",
          });
          const authToken = await test.authenticate({
            email: user.email,
            password: "password",
          });
          const startAt = new Date(Date.UTC(2025, 5, 2)).toISOString();
          const endAt = new Date(Date.UTC(2025, 5, 1)).toISOString();

          const response = await test.server.inject({
            method: "POST",
            url: "/price",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: { start_at: startAt, end_at: endAt },
          });

          expect(response.statusCode).toBe(422);
          const body = JSON.parse(response.body);
          expect(body.error).toBe("end_at must be after start_at");
        });
      });
    });
  });

  describe("when user is not authenticated", () => {
    it("returns 401 (unauthorized)", async () => {
      const authToken = "invalid-token";
      const startAt = new Date(Date.UTC(2025, 5, 1)).toISOString();
      const endAt = new Date(Date.UTC(2025, 5, 2)).toISOString();

      const response = await test.server.inject({
        method: "POST",
        url: "/price",
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { start_at: startAt, end_at: endAt },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
