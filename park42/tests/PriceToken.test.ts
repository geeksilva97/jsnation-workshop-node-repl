import { describe, expect, it } from "vitest";
import * as PriceToken from "../src/_lib/priceToken.js";

describe("PriceToken", () => {
  const startAt = new Date(Date.UTC(2025, 5, 1)).toISOString();
  const endAt = new Date(Date.UTC(2025, 5, 2)).toISOString();
  const price = 50000;
  const currency = "BRL";

  describe(".generate", () => {
    it("encrypts price data", () => {
      const result = PriceToken.generate({
        start_at: startAt,
        end_at: endAt,
        price,
        currency,
      });

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe(".decrypt", () => {
    it("decrypts the original price data", () => {
      const token = PriceToken.generate({
        start_at: startAt,
        end_at: endAt,
        price,
        currency,
      });

      const result = PriceToken.decrypt(token);

      expect(result).toEqual({
        start_at: startAt,
        end_at: endAt,
        price,
        currency,
      });
    });
  });
});
