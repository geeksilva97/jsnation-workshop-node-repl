import { DomainError } from "../_lib/errors/domain-error.js";
import type { ReservationPeriod } from "./reservation-period.js";

type Params = {
  id?: number;
  period: ReservationPeriod;
  price_token: string;
  payment_token: string;
  amount: number;
};

export class Reservation {
  readonly id?: number;
  readonly period: ReservationPeriod;
  readonly price_token: string;
  readonly payment_token: string;
  readonly amount: number;

  private constructor(params: Params) {
    if (params.id) this.id = params.id;
    this.period = params.period;
    this.price_token = params.price_token;
    this.payment_token = params.payment_token;
    this.amount = params.amount;
  }

  static create(params: Params) {
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

    return new Reservation(params);
  }
}
