import { ReservationPeriod } from "../domain/reservation-period.js";
import type { ReservationRepository } from "../domain/reservation-repository.js";
import { Reservation } from "../domain/reservation.js";
import type { PaymentService } from "./payment-api-service.js";

type ReservationDTO = {
  start_at: Date;
  end_at: Date;
  amount: number;
  price_token: string;
  payment_token: string;
};

type ServiceDependencies = {
  maxMonths: number;
  paymentService: PaymentService;
  reservationRepository: ReservationRepository;
};

class CreateReservationService {
  constructor(
    private readonly max_months: number,
    private readonly paymentService: PaymentService,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async execute({
    start_at,
    end_at,
    amount,
    price_token,
    payment_token,
    user_id,
  }: ReservationDTO & { user_id: number }): Promise<Reservation> {
    const period = ReservationPeriod.create({
      start_at: new Date(start_at),
      end_at: new Date(end_at),
      maxMonths: this.max_months,
    });

    const reservation = Reservation.create({
      amount,
      price_token,
      period,
      payment_token,
    });

    return await this.persist(user_id, reservation);
  }

  private async persist(user_id: number, reservation: Reservation) {
    const existingReservation = await this.reservationRepository.findByAttributes({
     period: reservation.period ,
     payment_token: reservation.payment_token,
     price_token: reservation.price_token,
     amount: reservation.amount,
    });

    if (existingReservation) {
      return existingReservation;
    }

    const createdReservation = await this.reservationRepository.store(user_id, reservation);

    try {
      // TODO: have a retry here?
      await this.paymentService.processPayment({
        payment_token: reservation.payment_token,
        amount: reservation.amount,
        reservation_id: createdReservation.id as number,
      });

      return Reservation.fromPersistence({
        id: createdReservation.id as number,
        payment_token: reservation.payment_token,
        price_token: reservation.price_token,
        amount: reservation.amount,
        period: reservation.period,
      });
    } catch (e) {
      console.error(`Error while calling the Mock Payment API`, e);

      await this.reservationRepository.delete(createdReservation.id as number)

      throw {
        message: "Unexpected error during the reservation creation",
      };
    }
  }
}

export const makeCreateReservationService = ({
  maxMonths,
  paymentService,
  reservationRepository,
}: ServiceDependencies) => {
  return new CreateReservationService(
    maxMonths,
    paymentService,
    reservationRepository,
  );
};
