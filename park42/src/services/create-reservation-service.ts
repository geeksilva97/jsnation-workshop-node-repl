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
  maxSpots: number;
  paymentService: PaymentService;
  reservationRepository: ReservationRepository;
};

class CreateReservationService {
  constructor(
    private readonly max_months: number,
    private readonly max_spots: number,
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
      userId: user_id,
    });

    const existingReservation = await this.getExistingReservation(reservation);
    if (existingReservation) {
      return existingReservation;
    }

    await this.checkAvailability(reservation.period);
    return await this.persist(reservation);
  }

  private async getExistingReservation(reservation: Reservation) {
    const existingReservation =
      await this.reservationRepository.findByAttributes({
        period: reservation.period,
        payment_token: reservation.payment_token,
        price_token: reservation.price_token,
        amount: reservation.amount,
      });

    return existingReservation;
  }

  private async persist(reservation: Reservation) {
    const createdReservation =
      await this.reservationRepository.store(reservation);

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

      await this.reservationRepository.delete(createdReservation.id as number);

      throw {
        message: "Unexpected error during the reservation creation",
      };
    }
  }

  private async checkAvailability(period: ReservationPeriod): Promise<void> {
    const overlappingReservations =
      await this.reservationRepository.findOverlapping(period);
    const countReservationsPerDate = overlappingReservations.reduce<
      Record<string, number>
    >((acc, reservation) => {
      const start = reservation.period.start.toISOString().split("T")[0];
      const end = reservation.period.end.toISOString().split("T")[0];
      for (
        let date = new Date(start);
        date <= new Date(end);
        date.setDate(date.getDate() + 1)
      ) {
        const dateKey = date.toISOString().split("T")[0];
        acc[dateKey] = (acc[dateKey] || 0) + 1;
      }
      return acc;
    }, {});

    const isAvailable = Object.values(countReservationsPerDate).every(
      (count) => count < this.max_spots,
    );

    if (!isAvailable) {
      throw {
        message: "No available spots for the selected period",
      };
    }
  }
}

export const makeCreateReservationService = ({
  maxMonths,
  maxSpots,
  paymentService,
  reservationRepository,
}: ServiceDependencies) => {
  return new CreateReservationService(
    maxMonths,
    maxSpots,
    paymentService,
    reservationRepository,
  );
};
