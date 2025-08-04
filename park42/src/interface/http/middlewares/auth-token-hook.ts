import type { FastifyReply } from "fastify";
import { Session } from "../../../infrastructure/database/models/session.js";
import type { AuthedFastifyRequest } from "../types/index.js";

export const authTokenHook = async (
  request: AuthedFastifyRequest,
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

  request.user = {
    id: session.user_id,
  };
};
