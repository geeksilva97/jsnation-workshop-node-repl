import type { PaymentStatus} from "../domain/reservation.js";
import type { ReservationRepository } from "../domain/reservation-repository.js";

type DTO = {
  reservationId: number;
  status: PaymentStatus;
};

type ServiceDependencies = {
  reservationRepository: ReservationRepository;
};

class UpdatePaymentStatusService {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async execute({ reservationId, status }: DTO) {
    const reservation = await this.reservationRepository.getById(reservationId);
    reservation.updateStatus(status);
    await this.reservationRepository.updateStatus(reservationId, status);
  }
}

export const makeUpdatePaymentStatusService = ({
  reservationRepository,
}: ServiceDependencies) => {
  return new UpdatePaymentStatusService(reservationRepository);
};
