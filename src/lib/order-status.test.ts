import { describe, expect, it } from "vitest";
import { validateOrderStatus } from "./catalog";

describe("order tracking", () => {
  it("accepts only confirmed, processing, dispatched and delivered statuses", () => {
    for (const status of ["confirmed", "processing", "dispatched", "delivered"]) expect(validateOrderStatus(status)).toBe(status);
    expect(() => validateOrderStatus("cancelled")).toThrow();
    expect(() => validateOrderStatus("")).toThrow();
  });
});