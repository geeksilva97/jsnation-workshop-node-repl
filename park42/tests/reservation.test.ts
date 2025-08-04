import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { setupTest, type Test } from "../src/_lib/testSupport/setupTest.js";
import { User } from "../src/infrastructure/database/models/user.js";
import * as PriceToken from "../src/_lib/priceToken.js";
import { createPaymentToken } from "./support/index.js";

// https://stackoverflow.com/questions/76836909/referenceerror-cannot-access-mock-before-initialization-when-using-vitest
const { mockProcessPayment } = vi.hoisted(() => {
  return { mockProcessPayment: vi.fn() };
});

vi.mock("../src/services/payment-api-service.js", () => ({
  makePaymentService: () => ({
    processPayment: mockProcessPayment,
  }),
}));

describe("POST /facts", () => {
  let test: Test;

  beforeAll(async () => {
    vi.setSystemTime(new Date("2025-01-01"));
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
      it("creates reservation", async () => {
        const user = await User.query().insert({
          email: "user@example.com",
          password: "password",
        });
        const payment_token = await createPaymentToken();
        const authToken = await test.authenticate({
          email: user.email,
          password: "password",
        });

        const start_at = new Date();
        const end_at = new Date();

        const price_token = PriceToken.generate({
          start_at: start_at.toISOString(),
          end_at: end_at.toISOString(),
          price: 50000,
          currency: "BRL",
        });

        const response = await test.server.inject({
          method: "POST",
          url: "/reservation",
          headers: { Authorization: `Bearer ${authToken}` },
          payload: {
            start_at,
            end_at,
            price_token,
            payment_token,
            amount: 50000,
          },
        });

        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.start_at).toBe("2025-01-01T00:00:00.000Z");
        expect(body.end_at).toBe("2025-01-01T00:00:00.000Z");
        expect(body.amount).toBe(50000);
      });

      describe("and reservation already exists", async () => {
        it("returns the already existing one", async () => {
          const user = await User.query().insert({
            email: "user@example.com",
            password: "password",
          });
          const payment_token = await createPaymentToken();
          const authToken = await test.authenticate({
            email: user.email,
            password: "password",
          });

          const start_at = new Date();
          const end_at = new Date();

          const price_token = PriceToken.generate({
            start_at: start_at.toISOString(),
            end_at: end_at.toISOString(),
            price: 50000,
            currency: "BRL",
          });

          const response1 = await test.server.inject({
            method: "POST",
            url: "/reservation",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: {
              start_at,
              end_at,
              price_token,
              payment_token,
              amount: 50000,
            },
          });

          const response2 = await test.server.inject({
            method: "POST",
            url: "/reservation",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: {
              start_at,
              end_at,
              price_token,
              payment_token,
              amount: 50000,
            },
          });

          const [body1, body2] = [
            JSON.parse(response1.body),
            JSON.parse(response2.body),
          ];

          expect(response1.statusCode).toBe(200);
          expect(response2.statusCode).toBe(200);
          expect(body1.id).toBe(body2.id);
          expect(body1.start_at).toBe("2025-01-01T00:00:00.000Z");
          expect(body1.end_at).toBe("2025-01-01T00:00:00.000Z");
          expect(body1.amount).toBe(50000);
        });
      });

      describe("and the mock payment api fails", () => {
        it.todo("does not create the reservation");
      });

      // describe("when payload is invalid", () => {
      //   it("returns 400 (Bad Request)", async () => {
      //     const user = await User.query().insert({
      //       email: "user2@example.com",
      //       password: "password",
      //     });
      //     const authToken = await test.authenticate({
      //       email: user.email,
      //       password: "password",
      //     });
      //     const startAt = new Date(Date.UTC(2025, 5, 2)).toISOString();
      //     const endAt = new Date(Date.UTC(2025, 5, 1)).toISOString();

      //     let response = await test.server.inject({
      //       method: "POST",
      //       url: "/facts",
      //       headers: { Authorization: `Bearer ${authToken}` },
      //       payload: { start_at: startAt, end_at: endAt },
      //     });

      //     let body = JSON.parse(response.body);

      //     expect(response.statusCode).toBe(400);
      //     expect(body.code).toBe("FST_ERR_VALIDATION");
      //     expect(body.error).toBe("Bad Request");
      //     expect(body.message).toBe(
      //       "body must have required property 'question'",
      //     );

      //     response = await test.server.inject({
      //       method: "POST",
      //       url: "/facts",
      //       headers: { Authorization: `Bearer ${authToken}` },
      //       payload: { question: "question here" },
      //     });

      //     body = JSON.parse(response.body);

      //     expect(response.statusCode).toBe(400);
      //     expect(body.code).toBe("FST_ERR_VALIDATION");
      //     expect(body.error).toBe("Bad Request");
      //     expect(body.message).toBe(
      //       "body must have required property 'answer'",
      //     );
      //   });
      // });
    });

    describe('when payload is invalid', () => {
      describe('when start_at is invalid', () => {
        it.todo('returns 400 (BadRequest)');
      });

      describe('when start_at is invalid', () => {
        it.todo('returns 400 (BadRequest)');
      });

      describe('when end_at is invalid', () => {
        it.todo('returns 400 (BadRequest)');
      });

      describe('when payment_token is invalid', () => {
        it.todo('returns 400 (BadRequest)');
      });

      describe('when price_token is invalid', () => {
        it.todo('returns 400 (BadRequest)');
      });
    });
  });

  // describe("when user is not authenticated", () => {
  //   it("returns 401 (unauthorized)", async () => {
  //     const authToken = "invalid-token";
  //     const startAt = new Date(Date.UTC(2025, 5, 1)).toISOString();
  //     const endAt = new Date(Date.UTC(2025, 5, 2)).toISOString();

  //     const response = await test.server.inject({
  //       method: "POST",
  //       url: "/facts",
  //       headers: { Authorization: `Bearer ${authToken}` },
  //       payload: { start_at: startAt, end_at: endAt },
  //     });

  //     expect(response.statusCode).toBe(401);
  //   });
  // });
});
