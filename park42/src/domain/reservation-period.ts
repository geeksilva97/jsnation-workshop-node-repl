import { addMonthsSafely, normalizeDate } from "../_lib/dates.js";
import { DomainError } from "../_lib/errors/domain-error.js";

type Period = {
  start_at: Date;
  end_at: Date;
  maxMonths: number;
};

export class ReservationPeriod {
  private constructor(readonly start: Date, readonly end: Date) {}

  static create(period: Period) {
    if (Number.isNaN(period.start_at.getTime()) || Number.isNaN(period.end_at.getTime())) {
      throw DomainError.create({
        message: "Start and end dates must be valid dates",
      });
    }

    if (Number.isNaN(period.maxMonths) || period.maxMonths < 1) {
      throw DomainError.create({
        message: "A max number of months must be set",
      });
    }

    const today = normalizeDate(new Date());
    const start_at = normalizeDate(period.start_at);

    if (start_at < today) {
      throw DomainError.create({
        message: "Start date cannot be before than today",
      });
    }

    const threeMonthsAheadDate = addMonthsSafely(today, period.maxMonths);
    const end_at = normalizeDate(period.end_at);

    if (end_at > threeMonthsAheadDate) {
      throw DomainError.create({
        message: `End date cannot be after ${period.maxMonths} months ahead`,
      });
    }

    return new ReservationPeriod(period.start_at, period.end_at);
  }
}

