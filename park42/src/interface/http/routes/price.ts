import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as PriceToken from "../../../_lib/priceToken.js";
import { Session } from "../../../infrastructure/database/models/session.js";

const DAILY_FEE = 25000;

export function priceRoutes(fastify: FastifyInstance) {
  fastify.post("/price", {
    schema: {
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["start_at", "end_at"],
        properties: {
          start_at: { type: "string", format: "date-time" },
          end_at: { type: "string", format: "date-time" },
        },
        examples: [
          {
            start_at: "2025-06-18T00:00:00Z",
            end_at: "2025-06-19T00:00:00Z",
          },
        ],
      },
      response: {
        200: {
          type: "object",
          properties: {
            price_token: { type: "string" },
            price: { type: "integer" },
            currency: { type: "string" },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = request.headers.authorization || "";
      if (!auth.startsWith("Bearer ")) {
        return reply.code(401).send();
      }
      const token = auth.replace("Bearer ", "").trim();
      const session = await Session.query().findOne({ token });
      if (!session) {
        return reply.code(401).send();
      }
      const { start_at, end_at } = request.body as {
        start_at: string;
        end_at: string;
      };

      const startAt = new Date(start_at);
      const endAt = new Date(end_at);

      if (Number.isNaN(startAt.getTime())) {
        return reply
          .code(422)
          .send({ error: "start_at must be a valid ISO 8601 timestamp" });
      }

      if (Number.isNaN(endAt.getTime())) {
        return reply
          .code(422)
          .send({ error: "end_at must be a valid ISO 8601 timestamp" });
      }

      if (endAt < startAt) {
        return reply.code(422).send({ error: "end_at must be after start_at" });
      }

      const totalDays =
        Math.floor((endAt.getTime() - startAt.getTime()) / 86400000) + 1;
      const price = totalDays * DAILY_FEE;
      const currency = "BRL";

      const price_token = PriceToken.generate({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        price,
        currency,
      });

      return { price_token, price, currency };
    },
  });
}
