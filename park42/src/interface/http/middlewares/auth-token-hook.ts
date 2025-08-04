import type { FastifyReply, FastifyRequest } from "fastify";
import { Session } from "../../../infrastructure/database/models/session.js";

export const authTokenHook = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
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
