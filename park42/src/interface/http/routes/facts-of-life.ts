import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { FactOfLife } from "../../../infrastructure/database/models/facts-of-life.js";
import { Session } from "../../../infrastructure/database/models/session.js";
import { UniqueViolationError } from "objection";

export const factsOfLifeRoutes = (fastify: FastifyInstance) => {
  const authMiddleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    // TODO: should auth be in each handler, every time??
    const auth = request.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return reply.code(401).send();
    }
    const token = auth.replace("Bearer ", "").trim();
    const session = await Session.query().findOne({ token });
    if (!session) {
      return reply.code(401).send();
    }
  };

  fastify.get("/facts", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          question: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
    handler: async (request: FastifyRequest) => {
      const { question } = request.query as { question: string };
      const fact = await FactOfLife.query().findOne({ question });

      return {
        question,
        fact,
        answer: fact?.answer || "No answer for that yet",
      };
    },
  });

  fastify.post("/facts", {
    schema: {
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        examples: [
          {
            question: "What is the best movie of all time?",
            answer: "Cinderela Baiana",
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
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { question, answer } = request.body as {
        question: string;
        answer: string;
      };

      try {
        await FactOfLife.query().insert({
          question,
          answer,
        });
      } catch (error) {
        console.error("Error while creating fact;", error); // TODO: use pino here
        if (error instanceof UniqueViolationError) {
          return reply.code(409).send({
            message: "This fact was already registered",
          });
        }

        return reply.code(500).send({
          message: "Something went wrong",
        });
      }

      reply.code(201).send({
        message: "Fact successfully created",
      });
    },
    preValidation: authMiddleware
  });
};
