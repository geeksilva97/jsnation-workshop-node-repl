import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";
import { authTokenHook } from "../middlewares/auth-token-hook.js";
import * as PriceTokenService from "../../../_lib/priceToken.js";
import { addMonthsSafely, normalizeDate } from "../../../_lib/dates.js";
import { makeCreateReservationService } from "../../../services/create-reservation-service.js";
import { makePaymentService } from "../../../services/payment-api-service.js";
import type { AuthedFastifyRequest } from "../types/index.js";

export type CreateReservationDto = {
  start_at: string;
  end_at: string;
  amount: number;
  price_token: string;
  payment_token: string;
};

const maxInterval = Number(process.env.MAX_INTERVAL);
const paymentService = makePaymentService({
  baseUrl: process.env.MOCK_API_URL || "http://localhost:4000",
});
const createReservationService = makeCreateReservationService({
  maxMonths: Number.isNaN(maxInterval) ? 3 : maxInterval,
  paymentService,
});

const createReservationHandler = async (
  request: AuthedFastifyRequest,
  reply: FastifyReply,
) => {
  // TODO: ensure type safety
  const { amount, end_at, price_token, start_at, payment_token } =
    request.body as CreateReservationDto;

  const reservation = await createReservationService.execute({
    start_at: new Date(start_at),
    end_at: new Date(end_at),
    amount,
    price_token,
    user_id: request.user.id,
    payment_token,
  });

  reply.send({
    id: reservation.id,
    start_at: reservation.period.start,
    end_at: reservation.period.end,
    amount: reservation.amount,
  });
};

const requestValidator = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  const { amount, end_at, price_token, start_at } =
    request.body as CreateReservationDto;
  const now = normalizeDate(new Date());
  // TODO: max months should come from an env
  const maxEndDate = addMonthsSafely(now, 3);
  const startAt = normalizeDate(new Date(start_at));
  const endAt = normalizeDate(new Date(end_at));

  if (startAt < now) {
    return reply
      .status(400)
      .send({ message: "start_at cannot be in the past" });
  }

  if (endAt > maxEndDate) {
    return reply
      .status(400)
      .send({ message: `end_at must be at most three months from today` });
  }

  if (
    !PriceTokenService.isValid({
      amount,
      start_at,
      end_at,
      token: price_token,
    })
  ) {
    return reply.status(400).send({
      message:
        "Price token information must match amount, start_at and end_at from request payload",
    });
  }

  done();
};

export const reservationRoutes = (fastify: FastifyInstance) => {
  fastify.post("/reservation", {
    schema: {
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: [
          "price_token",
          "payment_token",
          "start_at",
          "end_at",
          "amount",
        ],
        properties: {
          price_token: {
            type: "string",
            minLength: 1,
          },
          payment_token: {
            type: "string",
            minLength: 1,
            pattern: "^[a-fA-F0-9]+$",
          },
          start_at: {
            type: "string",
            format: "date-time",
          },
          end_at: {
            type: "string",
            format: "date-time",
          },
          amount: {
            type: "number",
            minimum: 1,
          },
        },
        additionalProperties: false,
        examples: [
          {
            price_token: "WybUz1hP9SP1ZYmZy3EPSb8i",
            payment_token:
              "4072a40d26ab1de87a9a4b4554e4a826646647702eab4263c5eeadd12364eedc",
            start_at: "2025-08-18T00:00:00Z",
            end_at: "2025-08-19T00:00:00Z",
            amount: 20000,
          },
        ],
      },
      response: {
        201: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    handler: createReservationHandler,
    preValidation: authTokenHook,
    preHandler: requestValidator,
  });
};
