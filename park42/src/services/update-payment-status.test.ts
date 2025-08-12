import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { setupTest, Test } from "../_lib/testSupport/setupTest.js";
import { makeUpdatePaymentStatusService } from "./update-payment-status.js";
import { Reservation } from "../domain/reservation.js";
import { reservationRepository } from "../../tests/support/stubs.js";

describe("UpdatePaymentStatus", () => {
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
    it("updates the reservation status", async () => {
      const r = Reservation.fromPersistence({
        price_token: "blah",
        payment_token: "blah",
        id: 42,
        payment_status: "PENDING",
        amount: 50000,
        period: {
          start: new Date(),
          end: new Date(),
        },
      });
      reservationRepository.getById.mockResolvedValue(r);
      const updatePaymentStatusService = makeUpdatePaymentStatusService({
        reservationRepository,
      });

      await updatePaymentStatusService.execute({
        reservationId: 42,
        status: "EXPIRED",
      });

      expect(reservationRepository.updateStatus).toHaveBeenCalledOnce();
      expect(reservationRepository.updateStatus).toHaveBeenCalledWith(
        42,
        "EXPIRED",
      );
    });

    describe("when reservation does not exist", () => {
      it("throws a notfound error", () => {});
    });
  });
});
