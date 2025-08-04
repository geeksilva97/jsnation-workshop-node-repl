import type { FastifyRequest } from "fastify";

export type AuthedFastifyRequest = FastifyRequest & {
  user: {
    id: number;
  };
};
