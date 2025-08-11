import { ReservationPeriod } from "../domain/reservation-period.js";
import { ReservationRepository } from "../domain/reservation-repository.js";
import { type PaymentStatus, Reservation } from "../domain/reservation.js";
import { ReservationModel } from "./database/models/reservation.js";

class ObjectReservationRepository implements ReservationRepository {
  async getById(reservationId: number): Promise<Reservation> {
    const reservation = await ReservationModel.query().findById(reservationId);

    if (!reservation) throw "notfound error";

    return Reservation.fromPersistence({
      amount: reservation.amount,
      payment_status: reservation.payment_status as PaymentStatus,
      id: reservation.id,
      payment_token: reservation.payment_token,
      period: {
        end: reservation.end_at,
        start: reservation.start_at,
      },
      price_token: reservation.price_token,
    });
  }

  async delete(reservationId: number): Promise<void> {
    await ReservationModel.query().deleteById(reservationId);
  }
  async store(user_id: number, reservation: Reservation): Promise<Reservation> {
    const result = await ReservationModel.query().insert({
      amount: reservation.amount,
      payment_status: reservation.payment_status,
      price_token: reservation.price_token,
      payment_token: reservation.payment_token,
      user_id,
      start_at: reservation.period.start,
      end_at: reservation.period.end,
    });

    return Reservation.fromPersistence({
      ...reservation,
      id: result.id,
    });
  }

  async updateStatus(
    id: number,
    status: Reservation["payment_status"],
  ): Promise<Reservation> {
    const reservation = await this.getById(id);
    const updatedRows = await ReservationModel.query()
      .update({ payment_status: status })
      .where({ id });

    if (updatedRows !== 1) throw "something went wrong";

    return Reservation.fromPersistence({
      amount: reservation.amount,
      payment_status: status,
      id,
      payment_token: reservation.payment_token,
      period: reservation.period,
      price_token: reservation.price_token,
    });
  }

  async findByAttributes({
    amount,
    period,
    payment_token,
    price_token,
  }: {
    period: ReservationPeriod;
    payment_token: string;
    price_token: string;
    amount: number;
  }): Promise<Reservation | null> {
    const existingReservation = await ReservationModel.query()
      .where({
        amount: amount,
        payment_token: payment_token,
        price_token: price_token,
        start_at: period.start,
        end_at: period.end,
      })
      .first();

    if (!existingReservation) return null;

    return Reservation.fromPersistence({
      amount: existingReservation.amount,
      payment_status: existingReservation.payment_status as PaymentStatus,
      price_token: existingReservation.price_token,
      payment_token: existingReservation.payment_token,
      period: period,
      id: existingReservation.id,
    });
  }
}

export const makeObjectionReservationRepository = () => {
  return new ObjectReservationRepository();
};
