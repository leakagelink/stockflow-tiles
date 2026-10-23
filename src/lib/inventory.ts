import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, adminVerify, getCatalog, placeOrderFn, storeLoginFn, type AdminPayload } from "./api.functions";

export type { Order, Product, Store } from "./catalog";
export { filterProducts, validateQty } from "./catalog";

type State = { loading: boolean; categories: string[]; products: Product[]; stores: Store[]; orders: Order[] };
type ProductT = Product;
type OrderT = Order;
type StoreT = Store;

// Re-declared locally for internal typing without value imports.
declare type ProductI = ProductT;
declare type OrderI = OrderT;
declare type StoreI = StoreT;

export const SESSION = "godown-store-session";
export const SESSION_PIN = "godown-store-pin";
export const ADMIN_SESSION = "godown-admin-session";

let state: State = { loading: true, categories: [], products: [], stores: [], orders: [] };
const listeners = new Set<() => void>();
let started = false;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Pull the latest shared godown state from the cloud database. */
export async function refresh() {
  try {
    const c = await getCatalog();
    set({ loading: false, categories: c.categories, products: c.products, stores: c.stores, orders: c.orders });
  } catch (e) {
    set({ loading: false });
    console.error("catalog load failed", e);
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refresh();
  // Live updates: when any store orders, every device refreshes automatically.
  const channel = supabase
    .channel("godown-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => void refresh())
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void refresh())
    .subscribe();
}

export function useInventory(): State {
  return useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

const adminPin = () => sessionStorage.getItem(ADMIN_SESSION) ?? "";
const storePin = () => sessionStorage.getItem(SESSION_PIN) ?? "";

export const actions = {
  verifyStore: async (storeId: string, pin: string) => {
    const id = await storeLoginFn({ data: { storeId, pin } });
    return id ?? null;
  },
  /** Deducts stock in the cloud database; every store sees the new stock immediately. */
  placeOrder: async (storeId: string, productId: string, qty: number) => {
    await placeOrderFn({ data: { storeId, pin: storePin(), productId, qty } });
    await refresh();
  },
  verifyAdminPin: (pin: string) => adminVerify({ data: { pin } }),
};

async function adminRun(payload: AdminPayload) {
  await adminAction({ data: { pin: adminPin(), payload } });
  await refresh();
}

export const adminOps = {
  upsertProduct: (p: Omit<Product, "id"> & { id?: string }) => adminRun({ op: "product_upsert", product: p }),
  deleteProduct: (id: string) => adminRun({ op: "product_delete", id }),
  addCategory: async (c: string) => {
    if (!c.trim()) return;
    await adminRun({ op: "category_add", name: c.trim() });
  },
  deleteCategory: (c: string) => adminRun({ op: "category_delete", name: c }),
  addStore: (name: string, pin: string) => adminRun({ op: "store_add", name, pin }),
  deleteStore: (id: string) => adminRun({ op: "store_delete", id }),
};
