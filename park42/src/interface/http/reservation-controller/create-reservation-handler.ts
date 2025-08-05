import { config } from "../../../config.js";
import type { CreateReservationDto } from "./index.js";
import type { FastifyReply, FastifyRequest } from "fastify";

export const schema = {
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["price_token", "payment_token", "start_at", "end_at", "amount"],
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
};
export const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: ensure type safety
  const { amount, end_at, price_token, start_at, payment_token } =
    request.body as CreateReservationDto;

  const reservation = await config.createReservationUseCase.execute({
    start_at: new Date(start_at),
    end_at: new Date(end_at),
    amount,
    price_token,
    user_id: request.user!.id,
    payment_token,
  });

  reply.send({
    id: reservation.id,
    start_at: reservation.period.start,
    end_at: reservation.period.end,
    amount: reservation.amount,
  });
};
