import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { decrypt } from "../src/_lib/priceToken.js";
import { setupTest, type Test } from "../src/_lib/testSupport/setupTest.js";
import { User } from "../src/infrastructure/database/models/user.js";

describe("POST /facts", () => {
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
          url: "/facts",
          headers: { Authorization: `Bearer ${authToken}` },
          payload: {
            question: 'some question?',
            answer: 'some answer'
          },
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.message).toBe("Fact successfully created");
      });

      describe("when payload is invalid", () => {
        it("returns 400 (Bad Request)", async () => {
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

          let response = await test.server.inject({
            method: "POST",
            url: "/facts",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: { start_at: startAt, end_at: endAt },
          });

          let body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.code).toBe("FST_ERR_VALIDATION");
          expect(body.error).toBe("Bad Request");
          expect(body.message).toBe("body must have required property 'question'");

          response = await test.server.inject({
            method: "POST",
            url: "/facts",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: { question: "question here" },
          });

          body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.code).toBe("FST_ERR_VALIDATION");
          expect(body.error).toBe("Bad Request");
          expect(body.message).toBe("body must have required property 'answer'");
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
        url: "/facts",
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { start_at: startAt, end_at: endAt },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
