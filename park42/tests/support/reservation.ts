import type { PaymentStatus } from "../../src/domain/reservation.js";
import { ReservationModel } from "../../src/infrastructure/database/models/reservation.js";

type CreateReservation = {
  payment_status: PaymentStatus;
};

export const createReservation = async (userId: number, opts?: Partial<CreateReservation>) => {
  return await ReservationModel.query().insert({
    amount: 50000,
    price_token: "price_token",
    payment_token: "payment_token",
    start_at: new Date(),
    end_at: new Date(),
    payment_status: opts?.payment_status ?? 'PENDING',
    user_id: userId,
  });
};

export const getReservation = async (reservationId: number) => {
  return await ReservationModel.query().findById(reservationId);
};
