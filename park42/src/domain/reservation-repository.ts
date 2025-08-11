import type { Reservation } from "./reservation.js";
import type { ReservationPeriod } from "./reservation-period.js";

export type ReservationRepository = {
  store(user_id: number, reservation: Reservation): Promise<Reservation>;
  delete(reservationId: number): Promise<void>;
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
