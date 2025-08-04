import { ReservationPeriod } from "../domain/reservation-period.js";
import { Reservation } from "../domain/reservation.js";
import { ReservationModel } from "../infrastructure/database/models/reservation.js";

type ReservationDTO = {
  start_at: Date;
  end_at: Date;
  amount: number;
  price_token: string;
  payment_token: string;
};

type PaymentProps = {
  payment_token: string;
  reservation_id: number;
  amount: number;
};

export type PaymentService = {
  call(props: PaymentProps): Promise<void>;
};

type ServiceDependencies = {
  maxMonths: number;
  paymentService: PaymentService;
};

class CreateReservationService {
  constructor(
    private readonly max_months: number,
    private readonly paymentService: PaymentService,
  ) {}

  async execute({
    start_at,
    end_at,
    amount,
    price_token,
    payment_token,
    user_id,
  }: ReservationDTO & { user_id: number }) {
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

    await this.persist({
      ...reservation,
      user_id,
    });
  }

  private async persist({
    amount,
    payment_token,
    price_token,
    user_id,
    period
  }: Reservation & { user_id: number }) {
    const reservation = await ReservationModel.query().insert({
      amount: amount,
      payment_token: payment_token,
      price_token: price_token,
      payment_status: "PENDING",
      user_id,
      start_at: period.start,
      end_at: period.end
    });

    try {
      // TODO: have a retry here?
      await this.paymentService.call({
        payment_token,
        amount,
        reservation_id: reservation.id,
      });
    } catch (e) {
      console.error(`Error while calling the Mock Payment API`, e);

      // what if this fails?
      await reservation.$query().delete();
    }
  }
}

export const makeCreateReservationService = ({
  maxMonths,
  paymentService,
}: ServiceDependencies) => {
  return new CreateReservationService(maxMonths, paymentService);
};
