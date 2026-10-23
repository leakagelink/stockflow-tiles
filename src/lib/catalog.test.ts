import { describe, it, expect } from "vitest";
import { filterProducts, validateQty, type Product } from "./catalog";

const products: Product[] = [
  { id: "p1", name: "Statuario Marble Glossy", model: "VT-6012", category: "Vitrified", size: "600x1200", price: 1450, stock: 100, color: "" },
  { id: "p2", name: "Anti-Skid Matt Grey", model: "BT-1108", category: "Bathroom", size: "300x300", price: 560, stock: 15, color: "" },
];

describe("catalog search", () => {
  it("finds tiles by name and by model number", () => {
    expect(filterProducts(products, "statuario", "All")).toHaveLength(1);
    expect(filterProducts(products, "vt-6012", "All")[0]?.id).toBe("p1");
  });
  it("filters by category", () => {
    expect(filterProducts(products, "", "Bathroom")[0]?.id).toBe("p2");
    expect(filterProducts(products, "", "All")).toHaveLength(2);
  });
});

describe("order quantity rule", () => {
  it("25 peti from 100 stock is allowed", () => {
    expect(validateQty(25, 100)).toBeNull();
  });
  it("rejects more than stock", () => {
    expect(validateQty(101, 100)).not.toBeNull();
  });
  it("rejects zero, negative and fractional peti", () => {
    expect(validateQty(0, 100)).toBeTruthy();
    expect(validateQty(-3, 100)).toBeTruthy();
    expect(validateQty(2.5, 100)).toBeTruthy();
  });
});
