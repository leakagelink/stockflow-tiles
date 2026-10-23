import { describe, expect, it } from "vitest";
import { requireAdminRole } from "./admin-access";
describe("administrator permissions", () => {
  it("allows the administrator role", () => { expect(() => requireAdminRole("admin")).not.toThrow(); });
  it("denies a customer or store account", () => { expect(() => requireAdminRole("customer")).toThrow(); expect(() => requireAdminRole("store")).toThrow(); });
  it("denies accounts with no assigned role", () => { expect(() => requireAdminRole(null)).toThrow(); expect(() => requireAdminRole(undefined)).toThrow(); });
});
