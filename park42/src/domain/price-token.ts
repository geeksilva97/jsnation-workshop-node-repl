type Params = {
  start_at: string;
  end_at: string;
  amount: number;
  token: string;
};

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class PriceToken {
  private constructor(
    readonly start_at: Date,
    readonly end_at: Date,
    readonly amount: number,
    readonly token: string,
  ) {}

  static create(params: Params): PriceToken {
    const { startDate, endDate } = PriceToken.validate(params);

    return new PriceToken(
      startDate,
      endDate,
      params.amount,
      params.token.trim(),
    );
  }

  private static validate(params: Params) {
    if (
      !params.token ||
      typeof params.token !== "string" ||
      params.token.trim().length === 0
    ) {
      throw new ValidationError("Token must be a non-empty string");
    }

    if (typeof params.amount !== "number" || params.amount <= 0) {
      throw new ValidationError("Amount must be a positive number");
    }

    if (!Number.isFinite(params.amount)) {
      throw new ValidationError("Amount must be a finite number");
    }

    if (!params.start_at || typeof params.start_at !== "string") {
      throw new ValidationError("start_at must be a string");
    }

    const startDate = new Date(params.start_at);
    if (Number.isNaN(startDate.getTime())) {
      throw new ValidationError("start_at must be a valid date string");
    }

    if (!params.end_at || typeof params.end_at !== "string") {
      throw new ValidationError("end_at must be a string");
    }

    const endDate = new Date(params.end_at);
    if (Number.isNaN(endDate.getTime())) {
      throw new ValidationError("end_at must be a valid date string");
    }

    if (endDate <= startDate) {
      throw new ValidationError("end_at must be after start_at");
    }

    const now = new Date();
    if (startDate < now) {
      throw new ValidationError("start_at cannot be in the past");
    }

    return { startDate, endDate };
  }
}
