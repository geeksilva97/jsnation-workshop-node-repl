import type { FastifyInstance } from "fastify";
import * as createReservation from "./create-reservation-handler.js";
import { authTokenHook } from "../middlewares/auth-token-hook.js";
import { requestValidator } from "./hooks.js";

export type CreateReservationDto = {
  start_at: string;
  end_at: string;
  amount: number;
  price_token: string;
  payment_token: string;
};

export const reservationRoutes = (fastify: FastifyInstance) => {
  fastify.post("/", {
    schema: createReservation.schema,
    handler: createReservation.handler,
    preValidation: authTokenHook,
    preHandler: requestValidator,
  });
};
