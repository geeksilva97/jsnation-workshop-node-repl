import type { Reservation } from "./reservation.js";
import type { ReservationPeriod } from "./reservation-period.js";

export type ReservationRepository = {
  store(reservation: Reservation): Promise<Reservation>;
  delete(reservationId: number): Promise<void>;
  getById(reservationId: number): Promise<Reservation>;
  findByStatusOlderThan(
    status: Reservation["payment_status"],
    date: Date,
  ): Promise<Reservation[]>;
  updateStatusBatch(
    ids: number[],
    status: Reservation["payment_status"],
  ): Promise<void>;
  updateStatus(
    id: number,
    status: Reservation["payment_status"],
  ): Promise<Reservation>;
  findByAttributes(attrs: {
    period: ReservationPeriod;
    payment_token: string;
    price_token: string;
    amount: number;
  }): Promise<Reservation | null>;
};
