import type { ReservationRepository } from "../domain/reservation-repository.js";

type ServiceDependencies = {
  reservationRepository: ReservationRepository;
  maxTime?: number;
};

class ExpireReservationsService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly maxTime: number,
  ) {}

  async execute() {
    const minDate = new Date(Date.now() - this.maxTime * 60 * 1000);
    const reservationsToExpire =
      await this.reservationRepository.findByStatusOlderThan(
        "PENDING",
        minDate,
      );
    await this.reservationRepository.updateStatusBatch(
      reservationsToExpire.map((reservation) => reservation.id as number),
      "EXPIRED",
    );
  }
}

export const makeExpireReservationsService = ({
  reservationRepository,
  maxTime = 15,
}: ServiceDependencies) => {
  return new ExpireReservationsService(reservationRepository, maxTime);
};
