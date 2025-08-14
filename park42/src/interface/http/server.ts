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
import { reservationRoutes } from "./reservation-controller/index.js";
import { webhookRoutes } from "./webhook-controller/index.js";
import { RecordNotFoundError, UpdateRecordError, DomainError } from "../../_lib/errors/index.js";

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
  server.register(reservationRoutes, { prefix: 'reservation' });
  server.register(webhookRoutes, { prefix: 'webhook' });

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    // Handle custom domain errors
    if (RecordNotFoundError.is(error)) {
      return reply.status(404).send({ message: error.message });
    }

    if (UpdateRecordError.is(error)) {
      return reply.status(400).send({ message: error.message });
    }

    if (DomainError.is(error)) {
      return reply.status(422).send({ message: error.message });
    }

    // Handle custom error objects (like from create-reservation-service)
    if (error.message && !error.validation && !error.statusCode) {
      return reply.status(500).send({ message: error.message });
    }

    // Handle Fastify validation errors
    if (error.validation) {
      const validationErrors = error.validation.map(err => ({
        field: err.instancePath || err.schemaPath || 'unknown',
        message: err.message
      }));
      
      return reply.status(400).send({ 
        message: "Validation error",
        errors: validationErrors
      });
    }

    // Handle other known HTTP errors
    if (error.statusCode) {
      return reply.status(error.statusCode).send({ 
        message: error.message || "An error occurred" 
      });
    }

    // Generic server error
    return reply.status(500).send({ 
      message: "Internal server error" 
    });
  });

  return server;
};
