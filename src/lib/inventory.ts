import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, adminMembers, adminVerify, getCatalog, myStoreFn, placeOrderFn, type AdminPayload } from "./api.functions";
import type { Order, Product, Store } from "./catalog";

export type { Order, Product, Store } from "./catalog";
export { filterProducts, validateQty } from "./catalog";

type State = {
  loading: boolean;
  categories: string[];
  products: Product[];
  stores: Store[];
  orders: Order[];
  userEmail: string | null;
  store: Store | null;
};

export const ADMIN_SESSION = "godown-admin-session";

let state: State = { loading: true, categories: [], products: [], stores: [], orders: [], userEmail: null, store: null };
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
    let store: Store | null = null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      try {
        store = await myStoreFn();
      } catch {
        store = null;
      }
    }
    set({ loading: false, categories: c.categories, products: c.products, stores: c.stores, orders: c.orders, store });
  } catch (e) {
    set({ loading: false });
    console.error("catalog load failed", e);
  }
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refresh();
  supabase.auth.getSession().then(({ data }) => set({ userEmail: data.session?.user.email ?? null }));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
    set({ userEmail: session?.user.email ?? null });
    void refresh();
  });
  // Live updates: when any store orders, every device refreshes automatically.
  supabase
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

export const actions = {
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },
  /** Returns true jab email confirmation pending ho (session abhi nahi bana). */
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
    return data.session === null;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ userEmail: null, store: null });
  },
  /** Deducts stock in the cloud database; every store sees the new stock immediately. */
  placeOrder: async (productId: string, qty: number) => {
    await placeOrderFn({ data: { productId, qty } });
    await refresh();
  },
  verifyAdminPin: (pin: string) => adminVerify({ data: { pin } }),
  /** Admin-only: staff accounts mapped to stores. */
  fetchMembers: (pin: string) => adminMembers({ data: { pin } }),
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
  addStore: (name: string) => adminRun({ op: "store_add", name }),
  deleteStore: (id: string) => adminRun({ op: "store_delete", id }),
  assignMember: (email: string, storeId: string) => adminRun({ op: "member_assign", email, storeId }),
  removeMember: (id: string) => adminRun({ op: "member_remove", id }),
};
