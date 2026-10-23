import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Order, Product, Store } from "./catalog";

export type Catalog = {
  products: Product[];
  categories: string[];
  stores: Store[];
  orders: Order[];
};

/** Publishable client for anonymous public reads (narrow SELECT policies only). */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        // Opaque sb_ keys are not JWTs: send apikey, drop the default bearer.
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const db = publicClient();
  const [products, cats, stores, orders] = await Promise.all([
    db.from("products").select("id,name,model,category,size,price,stock,color").order("created_at"),
    db.from("categories").select("name").order("name"),
    db.from("stores").select("id,name").order("created_at"),
    db.from("orders").select("id,store_id,store_name,product_id,product_name,model,qty,created_at").order("created_at", { ascending: false }),
  ]);
  const err = products.error || cats.error || stores.error || orders.error;
  if (err) throw new Error("Data load nahi hua: " + err.message);
  return {
    products: (products.data ?? []).map((p) => ({ ...p, price: Number(p.price) })),
    categories: (cats.data ?? []).map((c) => c.name),
    stores: stores.data ?? [],
    orders: (orders.data ?? []).map((o) => ({
      id: o.id,
      storeId: o.store_id,
      storeName: o.store_name,
      productId: o.product_id,
      productName: o.product_name,
      model: o.model,
      qty: o.qty,
      date: o.created_at,
    })),
  };
});

/** Order placement runs inside the database: PIN check + stock deduction + order insert, atomically. */
export const placeOrderFn = createServerFn({ method: "POST" })
  .validator((d: { storeId: string; pin: string; productId: string; qty: number }) => d)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: stock, error } = await db.rpc("place_order", {
      p_store_id: data.storeId,
      p_pin: data.pin,
      p_product_id: data.productId,
      p_qty: data.qty,
    });
    if (error) throw new Error(error.message);
    return { stock: Number(stock) };
  });

export const storeLoginFn = createServerFn({ method: "POST" })
  .validator((d: { storeId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: id, error } = await db.rpc("store_login", { p_store_id: data.storeId, p_pin: data.pin });
    if (error) throw new Error(error.message);
    return (id as string | null) ?? null;
  });

export type AdminPayload =
  | { op: "product_upsert"; product: Omit<Product, "id"> & { id?: string } }
  | { op: "product_delete"; id: string }
  | { op: "category_add"; name: string }
  | { op: "category_delete"; name: string }
  | { op: "store_add"; name: string; pin: string }
  | { op: "store_delete"; id: string };

/** Admin PIN lives in app_settings (no anon/authenticated grants) — verified server-side. */
async function adminDb(pin: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", "admin_pin").single();
  if (error) throw new Error("Admin PIN setting nahi mili");
  if (!data || data.value !== pin) throw new Error("Galat admin PIN");
  return supabaseAdmin;
}

export const adminVerify = createServerFn({ method: "POST" })
  .validator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("app_settings").select("value").eq("key", "admin_pin").single();
    if (error) throw new Error("Admin PIN setting nahi mili");
    return row?.value === data.pin;
  });

/** Stores tab needs PINs, which the public API never exposes — admin-only read. */
export const adminStores = createServerFn({ method: "GET" })
  .validator((d: { pin: string }) => d)
  .handler(async ({ data }) => {
    const db = await adminDb(data.pin);
    const { data: rows, error } = await db.from("stores").select("id,name,pin").order("created_at");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminAction = createServerFn({ method: "POST" })
  .validator((d: { pin: string; payload: AdminPayload }) => d)
  .handler(async ({ data }) => {
    const db = await adminDb(data.pin);
    const p = data.payload;
    let error: { message: string } | null = null;
    if (p.op === "product_upsert") {
      const row = {
        name: p.product.name,
        model: p.product.model,
        category: p.product.category,
        size: p.product.size,
        price: p.product.price,
        stock: p.product.stock,
        color: p.product.color,
      };
      const res = p.product.id
        ? await db.from("products").update(row).eq("id", p.product.id)
        : await db.from("products").insert(row);
      error = res.error;
    } else if (p.op === "product_delete") {
      error = (await db.from("products").delete().eq("id", p.id)).error;
    } else if (p.op === "category_add") {
      error = (await db.from("categories").insert({ name: p.name })).error;
    } else if (p.op === "category_delete") {
      error = (await db.from("categories").delete().eq("name", p.name)).error;
    } else if (p.op === "store_add") {
      error = (await db.from("stores").insert({ name: p.name, pin: p.pin })).error;
    } else if (p.op === "store_delete") {
      error = (await db.from("stores").delete().eq("id", p.id)).error;
    }
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
