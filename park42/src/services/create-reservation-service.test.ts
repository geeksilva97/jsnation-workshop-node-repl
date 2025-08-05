import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { setupTest, Test } from "../_lib/testSupport/setupTest.js";
import { User } from "../infrastructure/database/models/user.js";
import { makeCreateReservationService } from "./create-reservation-service.js";
import { ReservationModel } from "../infrastructure/database/models/reservation.js";

describe("CreateReservationService", () => {
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

  describe("execute", () => {
    describe("when Payment API succeeds", () => {
      it("creates reservation", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01"));
        const user = await User.query().insert({
          email: "xuxa@soparabaixinhos",
          password: "ilarie123",
        });

        const paymentService = {
          processPayment: vi.fn().mockResolvedValue({ status: "PROCESSING" }),
        };

        const createReservationService = makeCreateReservationService({
          maxMonths: 3,
          paymentService,
        });

        const reservation = await createReservationService.execute({
          start_at: new Date(),
          end_at: new Date('2025-01-02'),
          amount: 1000,
          price_token: 'price-token',
          payment_token: 'payment-token',
          user_id: user.id
        });


        expect(reservation).toMatchObject({
          id: 1,
          period: {
            start: new Date(),
            end: new Date('2025-01-02')
          },
          amount: 1000,
          payment_token: 'payment-token',
          price_token: 'price-token'
        });
      });
    });

    describe("when Payment API fails", () => {
      it("does not persist the reservation", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01"));
        const user = await User.query().insert({
          email: "xuxa@soparabaixinhos",
          password: "ilarie123",
        });

        const paymentService = {
          processPayment: vi.fn().mockRejectedValue({ errors: ['payment_token is invalid'] }),
        };

        const createReservationService = makeCreateReservationService({
          maxMonths: 3,
          paymentService,
        });

        const countReservationsBefore = await ReservationModel.query().resultSize();
        await expect(async () => {
          await createReservationService.execute({
            start_at: new Date(),
            end_at: new Date('2025-01-02'),
            amount: 1000,
            price_token: 'price-token',
            payment_token: 'payment-token',
            user_id: user.id
          });
        }).rejects.toThrow('Unexpected error during the reservation creation');
        const countReservationsAfter= await ReservationModel.query().resultSize();
        expect(countReservationsBefore).toBe(countReservationsAfter);
      });
    });
  });
});
