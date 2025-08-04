import crypto from "node:crypto";
import { normalizeDate } from "./dates.js";

export type PricePayload = {
  start_at: string;
  end_at: string;
  price: number;
  currency: string;
};

const SECRET = (process.env.SECRET_KEY || "secret")
  .slice(0, 32)
  .padEnd(32, "0");
const IV_LENGTH = 16;

export function generate({ start_at, end_at, price, currency }: PricePayload) {
  const payload = JSON.stringify({ start_at, end_at, price, currency });
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET), iv);
  let encrypted = cipher.update(payload);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.concat([iv, encrypted]).toString("base64");
}

export function decrypt(token: string): PricePayload | null {
  try {
    const data = Buffer.from(token, "base64");
    const iv = data.slice(0, IV_LENGTH);
    const encryptedText = data.slice(IV_LENGTH);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(SECRET),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString());
  } catch (_err) {
    // TODO: the error is swallowed, if something goes wrong this will be hard to debug
    return null;
  }
}

export const isValid = ({
  end_at,
  token,
  start_at,
  amount,
}: {
  token: string;
  start_at: string;
  end_at: string;
  amount: number;
}): boolean => {
  const pricePayload = decrypt(token);
  if (pricePayload === null) return false;

  const [startAt, endAt, pricePayloadStartAt, pricePayloadEndAt] = [
    start_at,
    end_at,
    pricePayload.start_at,
    pricePayload.end_at,
  ].map((d) => normalizeDate(new Date(d)));

  return (
    pricePayloadStartAt.getTime() === startAt.getTime() &&
    pricePayloadEndAt.getTime() === endAt.getTime() &&
    pricePayload.price === amount
  );
};
