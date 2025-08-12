import { DomainError } from "../_lib/errors/domain-error.js";
import type { ReservationPeriod } from "./reservation-period.js";

export type PaymentStatus = "PENDING" | "CONFIRMED" | "EXPIRED" | "FAILED";

type Params = {
  id?: number;
  period: ReservationPeriod;
  price_token: string;
  payment_token: string;
  payment_status?: PaymentStatus;
  amount: number;
  userId?: number;
};

export class Reservation {
  readonly id?: number;
  readonly period: ReservationPeriod;
  readonly price_token: string;
  readonly payment_token: string;
  readonly payment_status: PaymentStatus;
  readonly amount: number;
  readonly userId?: number;

  private constructor(params: Params) {
    if (params.id) this.id = params.id;
    if (params.userId) this.userId = params.userId;
    this.period = params.period;
    this.price_token = params.price_token;
    this.payment_token = params.payment_token;
    this.amount = params.amount;
    this.payment_status = params.payment_status || "PENDING";
  }

  static create(params: Params) {
    Reservation.validate(params);
    return new Reservation(params);
  }

  static fromPersistence(params: Params & { id: number }) {
    Reservation.validate(params);
    return new Reservation(params);
  }

  updateStatus(newStatus: PaymentStatus) {
    if (this.isTerminalStatus()) {
      throw DomainError.create({
        message: `Cannot update status from terminal state: ${this.payment_status}`,
      });
    }

    return new Reservation({
      ...this,
      payment_status: newStatus,
    });
  }

  private isTerminalStatus(): boolean {
    return ["CONFIRMED", "EXPIRED", "FAILED"].includes(this.payment_status);
  }

  private static validate(params: Params) {
    if (params.price_token.length === 0)
      throw DomainError.create({
        message: "Price token must be provided",
      });

    if (params.payment_token.length === 0)
      throw DomainError.create({
        message: "Payment token must be provided",
      });

    if (Number.isNaN(params.amount) || params.amount < 1)
      throw DomainError.create({
        message: "Amount must be a positive number",
      });
  }
}
