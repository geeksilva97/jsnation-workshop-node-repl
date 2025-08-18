import { type PaymentStatus, Reservation } from "../domain/reservation.js";
import type { ReservationRepository } from "../domain/reservation-repository.js";
import { ReservationModel } from "./database/models/reservation.js";
import type { ReservationPeriod } from "../domain/reservation-period.js";
import { RecordNotFoundError } from "../_lib/errors/record-not-found-error.js";
import { UpdateRecordError } from "../_lib/errors/update-record-error.js";

class ObjectionReservationRepository implements ReservationRepository {
  async findByStatusOlderThan(
    status: Reservation["payment_status"],
    date: Date,
  ): Promise<Reservation[]> {
    const models = await ReservationModel.query()
      .where("payment_status", status)
      .where("created_at", "<=", date);

    return models.map((model) => this.toEntity(model));
  }

  async updateStatusBatch(
    ids: number[],
    status: Reservation["payment_status"],
  ): Promise<void> {
    if (ids.length === 0) return;

    const updatedRows = await ReservationModel.query()
      .update({ payment_status: status })
      .whereIn("id", ids);

    if (updatedRows !== ids.length) {
      throw UpdateRecordError.create({
        message: `Expected to update ${ids.length} reservations, but updated ${updatedRows}`,
      });
    }
  }

  async getById(reservationId: number): Promise<Reservation> {
    const reservation = await ReservationModel.query().findById(reservationId);

    if (!reservation) {
      throw RecordNotFoundError.create({
        message: `Reservation ${reservationId} not found`,
      });
    }

    return this.toEntity(reservation);
  }

  async delete(reservationId: number): Promise<void> {
    await ReservationModel.query().deleteById(reservationId);
  }

  async store(reservation: Reservation): Promise<Reservation> {
    const result = await ReservationModel.query().insert({
      amount: reservation.amount,
      payment_status: reservation.payment_status,
      price_token: reservation.price_token,
      payment_token: reservation.payment_token,
      user_id: reservation.userId!,
      start_at: reservation.period.start,
      end_at: reservation.period.end,
    });

    return this.toEntity(result);
  }

  async updateStatus(
    id: number,
    status: Reservation["payment_status"],
  ): Promise<Reservation> {
    const reservation = await this.getById(id);
    try {
      const updatedRows = await ReservationModel.query()
        .update({ payment_status: status })
        .where({ id });

      if (updatedRows !== 1) {
        throw UpdateRecordError.create({
          message: `Failed to update reservation with id ${id}.`,
        });
      }

      return Reservation.fromPersistence({
        amount: reservation.amount,
        payment_status: status,
        id,
        payment_token: reservation.payment_token,
        period: reservation.period,
        price_token: reservation.price_token,
      });
    } catch (error) {
      throw UpdateRecordError.create({
        message: `Failed to update reservation with id ${id}.`,
        details: [{ originalError: error }],
      });
    }
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

    return this.toEntity(existingReservation);
  }

  async findOverlapping(period: ReservationPeriod): Promise<Reservation[]> {
    const models = await ReservationModel.query()
      .where("start_at", "<=", period.end)
      .where("end_at", ">=", period.start)
      .whereIn("payment_status", ["PENDING", "CONFIRMED"])
      .forUpdate();

    return models.map((model) => this.toEntity(model));
  }

  private toEntity(model: ReservationModel) {
    return Reservation.fromPersistence({
      id: model.id,
      amount: model.amount,
      payment_status: model.payment_status as PaymentStatus,
      payment_token: model.payment_token,
      period: {
        start: model.start_at,
        end: model.end_at,
      },
      price_token: model.price_token,
    });
  }
}

export const makeObjectionReservationRepository = () => {
  return new ObjectionReservationRepository();
};
