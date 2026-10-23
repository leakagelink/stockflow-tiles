import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { actions, adminOps, useInventory, ADMIN_SESSION, type Product } from "@/lib/inventory";
import type { MemberRow } from "@/lib/api.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — TileGodown" },
      { name: "description", content: "Godown stock, categories, stores aur orders manage karein." },
      { property: "og:title", content: "Admin Panel — TileGodown" },
      { property: "og:description", content: "Godown stock, categories, stores aur orders manage karein." },
    ],
  }),
  component: Admin,
});

const blank = { name: "", model: "", category: "", size: "", price: 0, stock: 0, color: "oklch(0.85 0.03 70)" };
const inp = "rounded-xl border border-input bg-background p-2.5 text-sm";

function Admin() {
  const s = useInventory();
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [tab, setTab] = useState<"stock" | "orders" | "stores" | "categories">("stock");
  const [form, setForm] = useState<Omit<Product, "id"> & { id?: string }>(blank);
  const [cat, setCat] = useState("");
  const [st, setSt] = useState({ name: "" });
  const [assign, setAssign] = useState({ email: "", storeId: "" });
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    if (tab !== "stores" || !ok) return;
    actions.fetchMembers(sessionStorage.getItem(ADMIN_SESSION) ?? "")
      .then(setMembers)
      .catch(() => {});
  }, [tab, ok, s.stores.length]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setMsg(""); setBusy(true);
    try { await fn(); } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  }

  async function reloadMembers() {
    const rows = await actions.fetchMembers(sessionStorage.getItem(ADMIN_SESSION) ?? "");
    setMembers(rows);
  }

  if (!ok) return (
    <div className="min-h-screen"><Header />
      <form onSubmit={async (e) => {
        e.preventDefault();
        setPinErr("");
        try { if (await actions.verifyAdminPin(pin)) { sessionStorage.setItem(ADMIN_SESSION, pin); setOk(true); } else setPinErr("Galat admin PIN"); }
        catch (x) { setPinErr((x as Error).message); }
      }} className="mx-auto mt-24 max-w-sm rounded-3xl border border-border bg-card p-6">
        <p className="font-display text-2xl">Admin Login</p>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Admin PIN (demo: 0000)" className={`${inp} mt-4 w-full`} />
        {pinErr && <p className="mt-2 text-sm text-destructive">{pinErr}</p>}
        <button className="mt-3 w-full rounded-xl bg-primary py-3 text-primary-foreground">Login</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="font-display text-4xl">Admin Panel</h1>
        <div className="mt-6 flex flex-wrap gap-2">
          {(["stock", "orders", "stores", "categories"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm capitalize ${tab === t ? "bg-foreground text-background" : "border border-border"}`}>{t}</button>
          ))}
          {busy && <Loader2 className="h-5 w-5 animate-spin self-center text-muted-foreground" />}
        </div>
        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

        {tab === "stock" && (
          <div className="mt-6 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.category) return; run(async () => { await adminOps.upsertProduct(form); setForm(blank); }); }} className="grid gap-2 rounded-3xl border border-border bg-card p-5 md:grid-cols-7">
              <input className={inp} placeholder="Tile name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inp} placeholder="Model no." value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Category</option>{s.categories.map((c) => <option key={c}>{c}</option>)}</select>
              <input className={inp} placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
              <input className={inp} type="number" placeholder="Price" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <input className={inp} type="number" placeholder="Stock (peti)" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              <button className="rounded-xl bg-primary text-sm text-primary-foreground">{form.id ? "Update" : "Add tile"}</button>
            </form>
            <div className="overflow-x-auto rounded-3xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground"><tr>{["Model", "Name", "Category", "Price", "Stock", ""].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
                <tbody>{s.products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-4 font-mono">{p.model}</td><td className="p-4">{p.name}</td><td className="p-4">{p.category}</td><td className="p-4">₹{p.price}</td>
                    <td className="p-4 font-semibold">{p.stock}</td>
                    <td className="p-4 text-right"><button onClick={() => setForm(p)} className="mr-3 underline">Edit</button><button onClick={() => run(() => adminOps.deleteProduct(p.id))}><Trash2 className="inline h-4 w-4 text-destructive" /></button></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr>{["Date", "Store", "Tile", "Model", "Peti"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
              <tbody>{s.orders.map((o) => (
                <tr key={o.id} className="border-t border-border"><td className="p-4">{new Date(o.date).toLocaleString("en-IN")}</td><td className="p-4">{o.storeName}</td><td className="p-4">{o.productName}</td><td className="p-4 font-mono">{o.model}</td><td className="p-4 font-semibold">{o.qty}</td></tr>
              ))}</tbody>
            </table>
            {s.orders.length === 0 && <p className="p-8 text-center text-muted-foreground">Abhi koi order nahi.</p>}
          </div>
        )}

        {tab === "stores" && (
          <div className="mt-6 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (st.name) run(async () => { await adminOps.addStore(st.name); setSt({ name: "" }); }); }} className="flex flex-wrap gap-2">
              <input className={inp} placeholder="Store name" value={st.name} onChange={(e) => setSt({ name: e.target.value })} />
              <button className="rounded-xl bg-primary px-4 text-sm text-primary-foreground">Add store</button>
            </form>
            {s.stores.map((x) => (
              <div key={x.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                <span>{x.name} <span className="ml-2 font-mono text-muted-foreground">{s.orders.filter((o) => o.storeId === x.id).length} orders</span></span>
                <button onClick={() => run(() => adminOps.deleteStore(x.id))}><Trash2 className="h-4 w-4 text-destructive" /></button>
              </div>
            ))}

            <div className="rounded-3xl border border-border bg-card p-5">
              <p className="font-display text-xl">Staff Accounts</p>
              <p className="mt-1 text-sm text-muted-foreground">Staff member pehle Store Panel par sign up kare, phir yahan uska email store se jodein.</p>
              <form onSubmit={(e) => { e.preventDefault(); if (assign.email && assign.storeId) run(async () => { await adminOps.assignMember(assign.email, assign.storeId); setAssign({ email: "", storeId: "" }); await reloadMembers(); }); }} className="mt-4 flex flex-wrap gap-2">
                <input className={inp} type="email" placeholder="Staff email" value={assign.email} onChange={(e) => setAssign({ ...assign, email: e.target.value })} />
                <select className={inp} value={assign.storeId} onChange={(e) => setAssign({ ...assign, storeId: e.target.value })}>
                  <option value="">Store chunein</option>
                  {s.stores.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <button className="rounded-xl bg-primary px-4 text-sm text-primary-foreground">Assign</button>
              </form>
              <div className="mt-4 space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-border bg-background p-3 text-sm">
                    <span>{m.email} <span className="ml-2 text-muted-foreground">→ {m.storeName}</span></span>
                    <button onClick={() => run(async () => { await adminOps.removeMember(m.id); await reloadMembers(); })}><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-muted-foreground">Abhi koi staff account assign nahi hai.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div className="mt-6 space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await adminOps.addCategory(cat); setCat(""); }); }} className="flex gap-2">
              <input className={inp} placeholder="New category" value={cat} onChange={(e) => setCat(e.target.value)} />
              <button className="rounded-xl bg-primary px-4 text-sm text-primary-foreground">Add</button>
            </form>
            <div className="flex flex-wrap gap-2">{s.categories.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">{c}<button onClick={() => run(() => adminOps.deleteCategory(c))}><Trash2 className="h-3 w-3 text-destructive" /></button></span>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
