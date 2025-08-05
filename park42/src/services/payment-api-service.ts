type PaymentRequest = {
  payment_token: string;
  reservation_id: number;
  amount: number;
};

type PaymentServiceConfig = {
  baseUrl: string;
};

export type PaymentService = {
  processPayment(paymentRequest: PaymentRequest): Promise<void>;
};

export class PaymentServiceAPI implements PaymentService {
  private readonly baseUrl: string;

  constructor(config: PaymentServiceConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async processPayment(request: PaymentRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        return;
      }

      const { errors } = (await response.json()) as { errors: string[] };

      throw `Unable to call /payments - errors: ${errors}`;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }
}

export function makePaymentService(
  config: PaymentServiceConfig,
): PaymentService {
  return new PaymentServiceAPI(config);
}
