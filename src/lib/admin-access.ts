/** Authorization rule shared by all administrator server operations. */
export function requireAdminRole(role: string | null | undefined): void {
  if (role !== "admin") throw new Error("Administrator access required.");
}
