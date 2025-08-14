import { config } from "../../config.js";
import { makeExpireReservationsService } from "../../services/expire-reservations.js";

const expireReservationsService = makeExpireReservationsService({
  reservationRepository: config.reservationRepository,
  maxTime: config.maxMinutsBeforeExpiring 
});

export const expireReservationsWorker = async () => {
  await expireReservationsService.execute();
};
