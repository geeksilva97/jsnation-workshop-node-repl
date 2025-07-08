import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Session } from "../../../infrastructure/database/models/session.js";
import { User } from "../../../infrastructure/database/models/user.js";

export function sessionRoutes(fastify: FastifyInstance) {
  fastify.post("/session", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
        },
        examples: [
          {
            email: "alice@email.com",
            password: "password",
          },
        ],
      },
      response: {
        200: {
          type: "object",
          properties: {
            token: { type: "string" },
          },
        },
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const user = await User.authenticate(email, password);
      if (!user) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      const session = await Session.query().insert({ user_id: user.id });

      return { token: session.token };
    },
  });
}
