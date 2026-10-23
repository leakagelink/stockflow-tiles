import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminRole } from "./admin-access";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
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
  if (err) throw new Error("Unable to load data: " + err.message);
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

/** Logged-in staff member ka store (store_members se). */
export const myStoreFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Store | null> => {
    const { data, error } = await context.supabase
      .from("store_members")
      .select("store_id, stores(id, name)")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const st = data?.stores as { id: string; name: string } | null;
    return st ? { id: st.id, name: st.name } : null;
  });

/** Order placement runs inside the database: store resolve + stock deduction + order insert, atomically. */
export const placeOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { productId: string; qty: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: stock, error } = await context.supabase.rpc("place_order_auth", {
      p_product_id: data.productId,
      p_qty: data.qty,
    });
    if (error) throw new Error(error.message);
    return { stock: Number(stock) };
  });

export type AdminPayload =
  | { op: "product_upsert"; product: Omit<Product, "id"> & { id?: string } }
  | { op: "product_delete"; id: string }
  | { op: "category_add"; name: string }
  | { op: "category_delete"; name: string }
  | { op: "store_add"; name: string }
  | { op: "store_delete"; id: string }
  | { op: "member_assign"; email: string; storeId: string }
  | { op: "member_remove"; id: string };

/** Verify the caller through their own RLS-scoped role row before privileged work. */
async function adminDb(db: SupabaseClient<Database>, userId: string) {
  const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error("Unable to verify administrator access.");
  requireAdminRole(data?.role);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminVerify = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (error) throw new Error("Unable to verify administrator access.");
    return data?.role === "admin";
  });

export type MemberRow = { id: string; email: string; storeId: string; storeName: string };

/** Stores tab: kaunsa staff account kis store se juda hai — admin-only read. */
export const adminMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MemberRow[]> => {
    const db = await adminDb(context.supabase, context.userId);
    const { data: rows, error } = await db.from("store_members").select("id, user_id, store_id, stores(name)").order("created_at");
    if (error) throw new Error(error.message);
    const { data: users, error: uErr } = await db.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw new Error(uErr.message);
    const emailById = new Map(users.users.map((u) => [u.id, u.email ?? ""]));
    return (rows ?? []).map((r) => ({
      id: r.id,
      email: emailById.get(r.user_id) ?? "(unknown)",
      storeId: r.store_id,
      storeName: (r.stores as { name: string } | null)?.name ?? "",
    }));
  });

export const adminAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { payload: AdminPayload }) => d)
  .handler(async ({ data, context }) => {
    const db = await adminDb(context.supabase, context.userId);
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
      error = (await db.from("stores").insert({ name: p.name, pin: "" })).error;
    } else if (p.op === "store_delete") {
      error = (await db.from("stores").delete().eq("id", p.id)).error;
    } else if (p.op === "member_assign") {
      const email = p.email.trim().toLowerCase();
      const { data: users, error: uErr } = await db.auth.admin.listUsers({ perPage: 1000 });
      if (uErr) throw new Error(uErr.message);
      const user = users.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (!user) throw new Error("No account found for this email. The staff member must sign up first.");
      // Ek staff member sirf ek store se juda hota hai
      const del = await db.from("store_members").delete().eq("user_id", user.id);
      if (del.error) throw new Error(del.error.message);
      error = (await db.from("store_members").insert({ user_id: user.id, store_id: p.storeId })).error;
    } else if (p.op === "member_remove") {
      error = (await db.from("store_members").delete().eq("id", p.id)).error;
    }
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
