import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { config } from "../../../config.js";

export const authWebhook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  const webhookSecret = request.headers["x-webhook-secret"] || "";

  if (webhookSecret !== config.secrets.paymentApiSecret) {
    return reply.code(401).send();
  }

  done();
};
