import { config } from "../../../config.js";
import { PaymentStatus } from "../../../domain/reservation.js";
import type { FastifyReply, FastifyRequest } from "fastify";

export const schema = {
  security: [{ bearerAuth: [] }],
  headers: {
    type: "object",
    properties: {
      "x-webhook-secret": { type: "string" },
    },
    required: ["x-webhook-secret"],
    additionalProperties: false,
  },
  body: {
    type: "object",
    required: ["status", "reservation_id"],
    properties: {
      status: {
        type: "string",
        enum: ["CONFIRMED", "FAILED"],
      },
      reservation_id: {
        type: "number",
        minimum: 1,
      },
    },
    additionalProperties: false,
    examples: [
      {
        status: "CONFIRMED",
        reservation_id: 42,
      },
    ],
  },
  response: {
    201: {
      type: "object",
      properties: {},
    },
  },
};

export const handler = async (request: FastifyRequest, reply: FastifyReply) => {
  const params = request.body as {
    status: PaymentStatus;
    reservation_id: number;
  };
  await config.updatePaymentStatusUseCase.execute({
    reservationId: params.reservation_id,
    status: params.status,
  });
  reply.status(201);
};
