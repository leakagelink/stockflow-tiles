import { describe, it, expect } from "vitest";
import { applyOrder, seed } from "./inventory";

describe("godown stock", () => {
  it("25 peti order from 100 leaves 75 for all stores", () => {
    const next = applyOrder(seed(), "s1", "p1", 25);
    expect(next.products.find((p) => p.id === "p1")!.stock).toBe(75);
    expect(next.orders[0]?.storeName).toBe("Store 1 - Main Market");
  });
  it("rejects order above stock", () => {
    expect(() => applyOrder(seed(), "s2", "p4", 16)).toThrow();
  });
});
