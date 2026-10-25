import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, adminMembers, adminUsers, adminVerify, getCatalog, myStoreFn, myOrdersFn, placeOrderFn, type AdminPayload } from "./api.functions";
import type { Order, OrderStatus, Product, Store } from "./catalog";

export type { Order, Product, Store } from "./catalog";
export { filterProducts, validateQty } from "./catalog";

type State = {
  loading: boolean;
  categories: string[];
  products: Product[];
  stores: Store[];
  orders: Order[];
  ordersError: string;
  userEmail: string | null;
  store: Store | null;
};


let state: State = { loading: true, categories: [], products: [], stores: [], orders: [], ordersError: "", userEmail: null, store: null };
let refreshVersion = 0;
const listeners = new Set<() => void>();
let started = false;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Pull the latest shared godown state from the cloud database. */
export async function refresh() {
  const version = ++refreshVersion;
  try {
    const c = await getCatalog();
    let store: Store | null = null;
    let orders: Order[] = [];
    let ordersError = "";
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      try {
        store = await myStoreFn();
      } catch {
        store = null;
      }
      try { orders = await myOrdersFn(); }
      catch { ordersError = "Unable to load your orders. Please try again."; }
    }
    if (version !== refreshVersion) return;
    set({ loading: false, categories: c.categories, products: c.products, stores: c.stores, orders, ordersError, store });
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
    ++refreshVersion;
    set({ userEmail: session?.user.email ?? null, store: null, orders: [], ordersError: "" });
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
    ++refreshVersion;
    set({ userEmail: null, store: null, orders: [], ordersError: "" });
  },
  /** Deducts stock in the cloud database; every store sees the new stock immediately. */
  placeOrder: async (productId: string, qty: number) => {
    await placeOrderFn({ data: { productId, qty } });
    await refresh();
  },
  verifyAdmin: () => adminVerify(),
  /** Admin-only: staff accounts mapped to stores. */
  fetchMembers: () => adminMembers(),
  /** Admin-only: saare registered users, roles aur store mapping. */
  fetchUsers: () => adminUsers(),
};

async function adminRun(payload: AdminPayload) {
  await adminAction({ data: { payload } });
  await refresh();
}

export const adminOps = {
  updateOrderStatus: (id: string, status: OrderStatus) => adminRun({ op: "order_status", id, status }),
  upsertProduct: (p: Omit<Product, "id"> & { id?: string }) => adminRun({ op: "product_upsert", product: p }),
  deleteProduct: (id: string) => adminRun({ op: "product_delete", id }),
  addCategory: async (c: string) => {
    if (!c.trim()) return;
    await adminRun({ op: "category_add", name: c.trim() });
  },
  renameCategory: (oldName: string, newName: string) => adminRun({ op: "category_rename", oldName, newName }),
  deleteCategory: (c: string) => adminRun({ op: "category_delete", name: c }),
  addStore: (name: string) => adminRun({ op: "store_add", name }),
  renameStore: (id: string, name: string) => adminRun({ op: "store_rename", id, name }),
  deleteStore: (id: string) => adminRun({ op: "store_delete", id }),
  assignMember: (email: string, storeId: string) => adminRun({ op: "member_assign", email, storeId }),
  removeMember: (id: string) => adminRun({ op: "member_remove", id }),
};
