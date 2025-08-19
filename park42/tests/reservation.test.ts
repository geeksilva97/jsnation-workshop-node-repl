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
import * as PriceToken from "../src/_lib/priceToken.js";
import { createPaymentToken, getUser } from "./support/index.js";
import { addMonthsSafely } from "../src/_lib/dates.js";
import { getReservations } from "./support/reservation.js";
import { ReservationModel } from "../src/infrastructure/database/models/reservation.js";

// https://stackoverflow.com/questions/76836909/referenceerror-cannot-access-mock-before-initialization-when-using-vitest
const { mockProcessPayment } = vi.hoisted(() => {
  return { mockProcessPayment: vi.fn() };
});

vi.mock("../src/services/payment-api-service.js", () => ({
  makePaymentService: () => ({
    processPayment: mockProcessPayment,
  }),
}));

describe("POST /reservation", () => {
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
        const { authToken } = await getUser(test);
        const payment_token = await createPaymentToken();
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

      describe("and multiple requests are sent concurrently", () => {
        it("allows reservation scheduling only if there are spots available", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
          const start_at = new Date();
          const end_at = new Date();

          const requests = Array.from({ length: 10 }, () =>
            test.server.inject({
              method: "POST",
              url: "/reservation",
              headers: { Authorization: `Bearer ${authToken}` },
              payload: {
                start_at,
                end_at,
                price_token: PriceToken.generate({
                  start_at: start_at.toISOString(),
                  end_at: end_at.toISOString(),
                  price: 50000,
                  currency: "BRL",
                }),
                payment_token,
                amount: 50000,
              },
            }),
          );

          const responses = await Promise.all(requests);
          const successes = responses.filter((r) => r.statusCode === 200);
          const conflicts = responses.filter((r) => r.statusCode === 409);
          const [successResponse] = successes;
          const successedBody = JSON.parse(successResponse.body);
          const errorMessages = Array.from(new Set(conflicts.map((r) => JSON.parse(r.body).message)));
          console.log({errorMessages})

          const reservations = await getReservations();
          const [createdReservation] = reservations;

          expect(reservations.length).toBe(1);
          expect(successes.length).toBe(1);
          expect(conflicts.length).toBe(requests.length - 1);
          expect(successedBody).toMatchObject({
            id: createdReservation.id,
            start_at: createdReservation.start_at.toISOString(),
            end_at: createdReservation.end_at.toISOString(),
            amount: createdReservation.amount,
          });
          expect(errorMessages.length).toEqual(1);
          expect(errorMessages[0]).toEqual('No available spots for the selected period');
        });
      });

      describe("and reservation already exists", async () => {
        it("returns the already existing one", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
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
        it("does not create the reservation", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
          const start_at = new Date();
          const end_at = new Date();

          mockProcessPayment.mockRejectedValue({
            errors: ["payment_token is invalid"],
          });

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

          expect(response.statusCode).toBe(500);
          expect(body.message).toBe(
            "Unexpected error during the reservation creation",
          );
        });
      });
    });

    describe("when payload is invalid", () => {
      describe.each([
        {
          case: "start_at is invalid",
          expectedField: "/start_at",
          expectedMessage: 'must match format "date-time"',
          payload: {
            start_at: null,
          },
        },
        {
          case: "end_at is invalid",
          expectedField: "/end_at",
          expectedMessage: 'must match format "date-time"',
          payload: {
            end_at: null,
          },
        },
        {
          case: "payment_token is invalid",
          expectedField: "/payment_token",
          expectedMessage: "must NOT have fewer than 1 characters",
          payload: {
            payment_token: "",
          },
        },
        {
          case: "price_token is invalid",
          expectedField: "/price_token",
          expectedMessage: "must NOT have fewer than 1 characters",
          payload: {
            price_token: "",
          },
        },
        {
          case: "amount is invalid",
          expectedField: "/amount",
          expectedMessage: "must be >= 1",
          payload: {
            amount: -1,
          },
        },
      ])("and $case", (testCaseProps) => {
        it("returns 400 (BadRequest)", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
          const start_at = new Date();
          const end_at = new Date();
          const amount = 50000;

          const price_token = PriceToken.generate({
            start_at: start_at.toISOString(),
            end_at: end_at.toISOString(),
            price: amount,
            currency: "BRL",
          });
          const basePayload = {
            start_at,
            end_at,
            price_token,
            payment_token,
            amount,
          };

          const newPayload = { ...basePayload, ...testCaseProps.payload };

          const response = await test.server.inject({
            method: "POST",
            url: "/reservation",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: newPayload,
          });

          const body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.message).toBe("Validation error");
          expect(body.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                field: testCaseProps.expectedField,
                message: testCaseProps.expectedMessage,
              }),
            ]),
          );
        });
      });

      describe("and start_at is before than today", () => {
        it("returns 400 (BadRequest)", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
          const start_at = new Date();
          const end_at = new Date();
          const amount = 50000;

          const price_token = PriceToken.generate({
            start_at: start_at.toISOString(),
            end_at: end_at.toISOString(),
            price: amount,
            currency: "BRL",
          });

          const response = await test.server.inject({
            method: "POST",
            url: "/reservation",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: {
              start_at: new Date(start_at.getTime() - 24 * 60 * 60 * 1000),
              end_at,
              price_token,
              payment_token,
              amount,
            },
          });

          const body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.message).toBe("start_at cannot be in the past");
        });
      });

      describe("and end_at is after three months ahead", () => {
        it("returns 400 (BadRequest)", async () => {
          const { authToken } = await getUser(test);
          const payment_token = await createPaymentToken();
          const start_at = new Date();
          const end_at = new Date();
          const amount = 50000;

          const price_token = PriceToken.generate({
            start_at: start_at.toISOString(),
            end_at: end_at.toISOString(),
            price: amount,
            currency: "BRL",
          });

          const response = await test.server.inject({
            method: "POST",
            url: "/reservation",
            headers: { Authorization: `Bearer ${authToken}` },
            payload: {
              start_at,
              end_at: addMonthsSafely(start_at, 4),
              price_token,
              payment_token,
              amount,
            },
          });

          const body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.message).toBe(
            "end_at must be at most three months from today",
          );
        });
      });
    });
  });
});
