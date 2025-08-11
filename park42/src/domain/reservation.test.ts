import { describe, expect, it, vi } from "vitest";
import { ReservationPeriod } from "./reservation-period.js";
import { Reservation } from "./reservation.js";

describe("Reservation", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));

  const period = ReservationPeriod.create({
    start_at: new Date("2025-01-01"),
    end_at: new Date("2025-03-02"),
    maxMonths: 3,
  });

  it("creates a valid domain object", () => {
    const reservation = Reservation.create({
      period,
      amount: 10000,
      payment_token: "blah",
      price_token: "blah",
    });

    expect(reservation).instanceof(Reservation);
    expect(reservation).toMatchObject({
      amount: 10000,
      payment_token: "blah",
      price_token: "blah",
      period,
      payment_status: "PENDING",
    });
  });

  it("updates the reservation payment status", () => {
    const reservation = Reservation.create({
      period,
      amount: 10000,
      payment_token: "blah",
      price_token: "blah",
    });

    const updated = reservation.updateStatus("CONFIRMED");

    expect(updated).instanceof(Reservation);
    expect(updated).toMatchObject({
      amount: 10000,
      payment_token: "blah",
      price_token: "blah",
      period,
      payment_status: "CONFIRMED",
    });
  });

  it("throws erro when status transition is invalid", () => {
    const reservation = Reservation.create({
      period,
      amount: 10000,
      payment_token: "blah",
      price_token: "blah",
    }).updateStatus("EXPIRED");

    expect(() => {
      reservation.updateStatus("CONFIRMED");
    }).toThrowError("Cannot update status from terminal state: EXPIRED");
  });

  it("throws error when price_token is invalid", () => {
    expect(() => {
      Reservation.create({
        period,
        amount: 10000,
        payment_token: "blah",
        price_token: "",
      });
    }).toThrowError("Price token must be provided");
  });

  it("throws error when payment_token is invalid", () => {
    expect(() => {
      Reservation.create({
        period,
        amount: 10000,
        payment_token: "",
        price_token: "blah",
      });
    }).toThrowError("Payment token must be provided");
  });

  it("throws error when amount is invalid", () => {
    expect(() => {
      Reservation.create({
        period,
        amount: -1,
        payment_token: "blah",
        price_token: "blah",
      });
    }).toThrowError("Amount must be a positive number");
  });
});
