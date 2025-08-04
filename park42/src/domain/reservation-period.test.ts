import { describe, expect, it, vi } from "vitest";
import { ReservationPeriod } from "./reservation-period.js";

describe("ReservationPeriod", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2025, 0, 1, 0, 0, 0));

  it("throws error when dates are invalid", () => {
    expect(() => {
      ReservationPeriod.create({
        start_at: new Date("2025-01-40"),
        end_at: new Date("2025-01-01"),
        maxMonths: 1,
      });
    }).toThrowError("Start and end dates must be valid dates");

    expect(() => {
      ReservationPeriod.create({
        start_at: new Date("2025-01-01"),
        end_at: new Date("2025-01-40"),
        maxMonths: 1,
      });
    }).toThrowError("Start and end dates must be valid dates");
  });

  it("throws error when maxMonths is not valid", () => {
    expect(() => {
      ReservationPeriod.create({
        start_at: new Date("2025-01-01"),
        end_at: new Date("2025-01-01"),
        maxMonths: -1,
      });
    }).toThrowError("A max number of months must be set");
  });

  it("throws error when start_at is before today", () => {
    expect(() => {
      ReservationPeriod.create({
        start_at: new Date("2024-12-31"),
        end_at: new Date("2025-01-01"),
        maxMonths: 1,
      });
    }).toThrowError("Start date cannot be before than today");
  });

  it("throws error when maxMonths is violated", () => {
    expect(() => {
      ReservationPeriod.create({
        start_at: new Date("2025-01-01"),
        end_at: new Date("2025-04-02"),
        maxMonths: 3,
      });
    }).toThrowError("End date cannot be after 3 months ahead");
  });
});
