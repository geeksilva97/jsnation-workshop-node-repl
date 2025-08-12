import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { setupTest, type Test } from "../_lib/testSupport/setupTest.js";
import { makeExpireReservationsService } from "./expire-reservations.js";
import type { ReservationRepository } from "../domain/reservation-repository.js";
import { makeObjectionReservationRepository } from "../infrastructure/objection-reservation-repository.js";
import { getUser } from "../../tests/support/index.js";
import { ReservationModel } from "../infrastructure/database/models/reservation.js";
import { PaymentStatus } from "../domain/reservation.js";

const getReservation = async (reservationId: number) => {
  return await ReservationModel.query().findById(reservationId);
};

const createReservation = async (
  userId: number,
  period: { start_at: Date; end_at: Date; created_at: Date },
  payment_status?: PaymentStatus,
) => {
  const r = await ReservationModel.query().insert({
    amount: 50000,
    price_token: "price_token",
    payment_token: "payment_token",
    payment_status: payment_status ?? "PENDING",
    user_id: userId,
    start_at: period.start_at,
    end_at: period.end_at,
  });

  r.created_at = period.created_at;
  await r.$query().update();
  return r;
};

describe("ExpireReservations", () => {
  let test: Test;
  let reservationRepository: ReservationRepository;

  beforeAll(async () => {
    test = await setupTest();
    reservationRepository = makeObjectionReservationRepository();
  });

  beforeEach(async () => {
    await test.cleanDatabase();
  });

  afterAll(async () => {
    await test.tearDown();
  });

  describe("execute", () => {
    describe("ExpireReservationsService", () => {
      it("expires reservations older than 15 minutes while keeping recent ones pending", async () => {
        const fixedDate = new Date(2025, 1, 1, 12, 0, 0); // Feb 1, 2025 12:00:00
        vi.setSystemTime(fixedDate);

        const { user } = await getUser(test);

        const [oldReservation, recentReservation, exactlyExpiredReservation] =
          await Promise.all([
            createReservation(user.id, {
              start_at: new Date(),
              end_at: new Date(),
              created_at: new Date(fixedDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours old
            }),
            createReservation(user.id, {
              start_at: new Date(),
              end_at: new Date(),
              created_at: new Date(fixedDate.getTime() - 5 * 60 * 1000), // 5 minutes old
            }),
            createReservation(user.id, {
              start_at: new Date(),
              end_at: new Date(),
              created_at: new Date(fixedDate.getTime() - 16 * 60 * 1000), // 16 minutes old
            }),
          ]);

        expect(oldReservation.payment_status).toBe("PENDING");
        expect(recentReservation.payment_status).toBe("PENDING");
        expect(exactlyExpiredReservation.payment_status).toBe("PENDING");

        // Act
        const useCase = makeExpireReservationsService({
          reservationRepository,
          maxTime: 15,
        });
        await useCase.execute();

        // Assert
        const [updatedOld, updatedRecent, updatedExpired] = await Promise.all([
          getReservation(oldReservation.id),
          getReservation(recentReservation.id),
          getReservation(exactlyExpiredReservation.id),
        ]);

        // Verify expired reservations
        expect(updatedOld).toMatchObject({
          id: oldReservation.id,
          payment_status: "EXPIRED",
        });

        expect(updatedExpired).toMatchObject({
          id: exactlyExpiredReservation.id,
          payment_status: "EXPIRED",
        });

        // Verify recent reservation remains pending
        expect(updatedRecent).toMatchObject({
          id: recentReservation.id,
          payment_status: "PENDING",
        });
      });

      it("handles empty result set gracefully", async () => {
        const fixedDate = new Date(2025, 1, 1, 12, 0, 0);
        vi.setSystemTime(fixedDate);

        const { user } = await getUser(test);

        await createReservation(user.id, {
          start_at: new Date(),
          end_at: new Date(),
          created_at: new Date(fixedDate.getTime() - 5 * 60 * 1000), // 5 minutes old
        });

        // Act & Assert - should not throw
        const useCase = makeExpireReservationsService({
          reservationRepository,
          maxTime: 15,
        });

        await expect(useCase.execute()).resolves.not.toThrow();
      });

      it("respects custom expiration timeout", async () => {
        const fixedDate = new Date(2025, 1, 1, 12, 0, 0);
        vi.setSystemTime(fixedDate);

        const { user } = await getUser(test);

        const reservation = await createReservation(user.id, {
          start_at: new Date(),
          end_at: new Date(),
          created_at: new Date(fixedDate.getTime() - 25 * 60 * 1000),
        });

        const useCase = makeExpireReservationsService({
          reservationRepository,
          maxTime: 30,
        });
        await useCase.execute();

        // Assert - should still be pending since 25 min < 30 min
        const updated = await getReservation(reservation.id);
        expect(updated?.payment_status).toBe("PENDING");
      });

      it("only expires pending reservations, not already processed ones", async () => {
        const fixedDate = new Date(2025, 1, 1, 12, 0, 0);
        vi.setSystemTime(fixedDate);

        const { user } = await getUser(test);

        const [pendingReservation, paidReservation] = await Promise.all([
          createReservation(
            user.id,
            {
              start_at: new Date(),
              end_at: new Date(),
              created_at: new Date(fixedDate.getTime() - 20 * 60 * 1000),
            },
            "PENDING",
          ),
          createReservation(
            user.id,
            {
              start_at: new Date(),
              end_at: new Date(),
              created_at: new Date(fixedDate.getTime() - 20 * 60 * 1000), // 20 minutes old
            },
            "CONFIRMED",
          ),
        ]);

        const useCase = makeExpireReservationsService({
          reservationRepository,
          maxTime: 15,
        });
        await useCase.execute();

        const [updatedPending, updatedPaid] = await Promise.all([
          getReservation(pendingReservation.id),
          getReservation(paidReservation.id),
        ]);

        expect(updatedPending?.payment_status).toBe("EXPIRED");
        expect(updatedPaid?.payment_status).toBe("CONFIRMED");
      });
    });
  });
});
