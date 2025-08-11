import type { FastifyInstance } from "fastify";
import { authWebhook } from "./hooks.js";
import * as updateStatus from "./update-payment-status-handler.js";

export type CreateReservationDto = {
  start_at: string;
  end_at: string;
  amount: number;
  price_token: string;
  payment_token: string;
};

export const webhookRoutes = (fastify: FastifyInstance) => {
  fastify.post("/payment", {
    schema: updateStatus.schema,
    handler: updateStatus.handler,
    preValidation: authWebhook,
  });
};
