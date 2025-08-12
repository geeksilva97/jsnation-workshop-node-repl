import { vi } from "vitest";

export const reservationRepository = {
  getById: vi.fn().mockResolvedValue({ id: 42 }),
  store: vi.fn().mockResolvedValue({ id: 42 }),
  delete: vi.fn().mockResolvedValue(null),
  updateStatus: vi.fn().mockResolvedValue({}),
  findByAttributes: vi.fn().mockResolvedValue({ id: 42 }),
  findByStatusOlderThan: vi.fn(),
  updateStatusBatch: vi.fn(),
};
