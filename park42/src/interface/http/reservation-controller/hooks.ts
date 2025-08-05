import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { CreateReservationDto } from "./index.js";
import { addMonthsSafely, normalizeDate } from "../../../_lib/dates.js";
import * as PriceTokenService from "../../../_lib/priceToken.js";

export const requestValidator = (
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
