import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { setupTest, type Test } from "../../src/_lib/testSupport/setupTest.js";
import { Reservation } from "../../src/domain/reservation.js";
import { makeObjectionReservationRepository } from "../../src/infrastructure/objection-reservation-repository.js";
import { getUser } from "../support/index.js";

const createReservation = async (userId: number) => {
  const reservationRepository = makeObjectionReservationRepository();
  const reservation = Reservation.create({
    amount: 50000,
    price_token: "price_token",
    payment_token: "payment_token",
    period: {
      start: new Date(),
      end: new Date(),
    },
  });

  return await reservationRepository.store(userId, reservation);
};

const getReservation = async (reservationId: number) => {
  const reservationRepository = makeObjectionReservationRepository();
  return await reservationRepository.getById(reservationId);
};

describe("POST /webhook/payment", () => {
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

  describe("when request is authenticated", () => {
    describe("and payload is valid", () => {
      it("updates reservation status", async () => {
        const { user } = await getUser(test);
        const reservation = await createReservation(user.id);
        const response = await test.server.inject({
          method: "POST",
          url: "/webhook/payment",
            headers: {
              'X-Webhook-Secret': 'cinderela-baiana'
            },
          payload: {
            status: "CONFIRMED",
            reservation_id: 1,
          },
        });

        const updatedReservation = await getReservation(
          reservation.id as number,
        );

        expect(response.statusCode).toBe(201);
        expect(reservation.id).toBe(updatedReservation.id);
        expect(reservation.payment_status).toBe("PENDING");
        expect(updatedReservation.payment_status).toBe("CONFIRMED");
      });
    });

    describe("when payload is invalid", () => {
      describe.each([
        {
          case: "status is not present",
          expectedValidationErrorMessage:
            "body must have required property 'status'",
          payload: {
            reservation_id: 1,
          },
        },
        {
          case: "status is invalid",
          expectedValidationErrorMessage:
            "body/status must be equal to one of the allowed values",
          payload: {
            reservation_id: 1,
            status: "",
          },
        },
        {
          case: "reservation_id is not present",
          expectedValidationErrorMessage:
            "body must have required property 'reservation_id'",
          payload: {
            status: "CONFIMED",
          },
        },
        {
          case: "reservation_id is invalid",
          expectedValidationErrorMessage: "body/reservation_id must be >= 1",
          payload: {
            reservation_id: -1,
            status: "CONFIRMED",
          },
        },
      ])("and $case", ({ payload, expectedValidationErrorMessage }) => {
        it("returns 400 (BadRequest)", async () => {
          const response = await test.server.inject({
            method: "POST",
            url: "/webhook/payment",
            headers: {
              'X-Webhook-Secret': 'cinderela-baiana'
            },
            payload: payload,
          });

          const body = JSON.parse(response.body);

          expect(response.statusCode).toBe(400);
          expect(body.message).toBe(expectedValidationErrorMessage);
        });
      });
    });
  });

  describe("when request is authenticated", () => {
    it("returns 401 (Unauthorized)", async () => {
      const response = await test.server.inject({
        method: "POST",
        url: "/webhook/payment",
        headers: {},
        payload: {
          status: "CONFIRMED",
          reservation_id: 1,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
