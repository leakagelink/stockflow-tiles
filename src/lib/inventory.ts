import { useSyncExternalStore } from "react";

export type Product = { id: string; name: string; model: string; category: string; size: string; price: number; stock: number; color: string };
export type Store = { id: string; name: string; pin: string };
export type Order = { id: string; storeId: string; storeName: string; productId: string; productName: string; model: string; qty: number; date: string };
export type State = { categories: string[]; products: Product[]; stores: Store[]; orders: Order[]; adminPin: string };

const KEY = "godown-state-v1";
const uid = () => Math.random().toString(36).slice(2, 10);

export const seed = (): State => ({
  adminPin: "0000",
  categories: ["Floor Tiles", "Wall Tiles", "Vitrified", "Bathroom", "Outdoor"],
  stores: [
    { id: "s1", name: "Store 1 - Main Market", pin: "1111" },
    { id: "s2", name: "Store 2 - Station Road", pin: "2222" },
    { id: "s3", name: "Store 3 - Ring Road", pin: "3333" },
  ],
  products: [
    { id: "p1", name: "Statuario Marble Glossy", model: "VT-6012", category: "Vitrified", size: "600x1200", price: 1450, stock: 100, color: "oklch(0.93 0.01 80)" },
    { id: "p2", name: "Rustic Wood Plank", model: "FL-2045", category: "Floor Tiles", size: "200x1200", price: 980, stock: 64, color: "oklch(0.62 0.08 55)" },
    { id: "p3", name: "Moroccan Blue Pattern", model: "WL-3310", category: "Wall Tiles", size: "300x450", price: 720, stock: 120, color: "oklch(0.55 0.12 250)" },
    { id: "p4", name: "Anti-Skid Matt Grey", model: "BT-1108", category: "Bathroom", size: "300x300", price: 560, stock: 15, color: "oklch(0.6 0.01 250)" },
    { id: "p5", name: "Parking Stone Cobble", model: "OD-7720", category: "Outdoor", size: "400x400", price: 640, stock: 210, color: "oklch(0.5 0.03 60)" },
    { id: "p6", name: "Onyx Gold Polished", model: "VT-6099", category: "Vitrified", size: "800x1600", price: 2350, stock: 40, color: "oklch(0.82 0.08 85)" },
  ],
  orders: [],
});

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
  window.addEventListener("storage", (e) => { if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); listeners.forEach((l) => l()); } });
}
function set(next: State) {
  state = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useInventory() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

/** Pure rule: ordering deducts from shared godown stock; cannot exceed stock. */
export function applyOrder(s: State, storeId: string, productId: string, qty: number): State {
  const store = s.stores.find((x) => x.id === storeId);
  const p = s.products.find((x) => x.id === productId);
  if (!store || !p) throw new Error("Store ya product nahi mila");
  if (!Number.isInteger(qty) || qty <= 0) throw new Error("Sahi quantity daalein");
  if (qty > p.stock) throw new Error(`Sirf ${p.stock} peti stock mein hai`);
  return {
    ...s,
    products: s.products.map((x) => (x.id === productId ? { ...x, stock: x.stock - qty } : x)),
    orders: [{ id: uid(), storeId, storeName: store.name, productId, productName: p.name, model: p.model, qty, date: new Date().toISOString() }, ...s.orders],
  };
}

export const actions = {
  placeOrder: (storeId: string, productId: string, qty: number) => set(applyOrder(state, storeId, productId, qty)),
  upsertProduct: (p: Omit<Product, "id"> & { id?: string }) =>
    set({ ...state, products: p.id ? state.products.map((x) => (x.id === p.id ? (p as Product) : x)) : [...state.products, { ...p, id: uid() }] }),
  deleteProduct: (id: string) => set({ ...state, products: state.products.filter((x) => x.id !== id) }),
  addCategory: (c: string) => c && !state.categories.includes(c) && set({ ...state, categories: [...state.categories, c] }),
  deleteCategory: (c: string) => set({ ...state, categories: state.categories.filter((x) => x !== c) }),
  addStore: (name: string, pin: string) => set({ ...state, stores: [...state.stores, { id: uid(), name, pin }] }),
  deleteStore: (id: string) => set({ ...state, stores: state.stores.filter((x) => x.id !== id) }),
};

export const SESSION = "godown-store-session";
