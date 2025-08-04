import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { Queue } from "bullmq";
import fastify from "fastify";
import { config } from "../../config.js";
import { healthRoutes } from "./routes/health.js";
import { priceRoutes } from "./routes/price.js";
import { sessionRoutes } from "./routes/session.js";
import { reservationRoutes } from "./routes/reservation.js";

export const makeServer = async (dependencies: { queue: Queue }) => {
  const { queue } = dependencies;

  const server = fastify({ logger: config.http.logger[config.env] });

  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });
  serverAdapter.setBasePath("/queues");
  server.register(serverAdapter.registerPlugin(), { prefix: "/queues" });

  server.decorate("queue", queue);

  server.register(swagger, {
    openapi: {
      info: {
        title: "Park42 API",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  server.register(swaggerUi, { routePrefix: "/api-docs" });

  server.get("/", async (_request, reply) => {
    return reply.redirect("/api-docs", 301);
  });

  server.register(healthRoutes);
  server.register(sessionRoutes);
  server.register(priceRoutes);
  server.register(reservationRoutes);

  return server;
};
