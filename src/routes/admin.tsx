import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { actions, adminOps, useInventory, ADMIN_SESSION, type Product } from "@/lib/inventory";
import type { MemberRow } from "@/lib/api.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — TileGodown" },
      { name: "description", content: "Godown stock, categories, stores aur orders manage karein." },
      { property: "og:title", content: "Admin Panel — TileGodown" },
      { property: "og:description", content: "Godown stock, categories, stores aur orders manage karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const blank = { name: "", model: "", category: "", size: "", price: 0, stock: 0, color: "oklch(0.85 0.03 70)" };
const inp = "min-w-0 w-full min-h-11 rounded-lg border border-input bg-background p-2.5 text-base sm:text-sm";

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
      }} className="mx-auto mt-8 w-[calc(100%-2rem)] max-w-sm rounded-lg border border-border bg-card p-5 sm:mt-24 sm:p-6">
        <p className="font-display text-2xl">Admin Login</p>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Admin PIN (demo: 0000)" className={`${inp} mt-4 w-full`} />
        {pinErr && <p className="mt-2 text-sm text-destructive">{pinErr}</p>}
        <Button className="mt-3 h-12 w-full">Login</Button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Admin Panel</h1>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(["stock", "orders", "stores", "categories"] as const).map((t) => (
            <Button variant={tab === t ? "default" : "outline"} key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`h-11 px-4 capitalize ${tab === t ? "bg-foreground text-background hover:bg-foreground hover:text-background" : ""}`}>{t}</Button>
          ))}
          {busy && <Loader2 className="h-5 w-5 animate-spin self-center text-muted-foreground" />}
        </div>
        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

        {tab === "stock" && (
          <div className="mt-6 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.category) return; run(async () => { await adminOps.upsertProduct(form); setForm(blank); }); }} className="grid min-w-0 gap-3 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
              <input className={inp} placeholder="Tile name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={inp} placeholder="Model no." value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Category</option>{s.categories.map((c) => <option key={c}>{c}</option>)}</select>
              <input className={inp} placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
              <input className={inp} type="number" placeholder="Price" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <input className={inp} type="number" placeholder="Stock (peti)" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              <Button className="h-11">{form.id ? "Update" : "Add tile"}</Button>
            </form>
            <div className="space-y-3 sm:hidden">
              {s.products.map((p) => (
                <article key={p.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">{p.model}</p><h2 className="mt-1 font-semibold">{p.name}</h2><p className="mt-1 text-sm text-muted-foreground">{p.category} · {p.size}</p></div>
                    <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" className="h-11 w-11" title="Edit tile" aria-label={`Edit ${p.name}`} onClick={() => { setForm(p); window.scrollTo({ top: 0 }); }}><Pencil /></Button><Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" title="Delete tile" aria-label={`Delete ${p.name}`} onClick={() => run(() => adminOps.deleteProduct(p.id))}><Trash2 /></Button></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm"><p>₹{p.price.toLocaleString("en-IN")} /peti</p><p className="text-right font-semibold">{p.stock} peti</p></div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground"><tr>{["Model", "Name", "Category", "Price", "Stock", ""].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
                <tbody>{s.products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-4 font-mono">{p.model}</td><td className="p-4">{p.name}</td><td className="p-4">{p.category}</td><td className="p-4">₹{p.price}</td>
                    <td className="p-4 font-semibold">{p.stock}</td>
                    <td className="p-4 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-11 w-11" aria-label={`Edit ${p.name}`} title="Edit tile" onClick={() => setForm(p)}><Pencil /></Button><Button variant="ghost" size="icon" className="h-11 w-11 text-destructive" aria-label={`Delete ${p.name}`} title="Delete tile" onClick={() => run(() => adminOps.deleteProduct(p.id))}><Trash2 /></Button></div></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6">
            <div className="space-y-3 sm:hidden">{s.orders.map((o) => (
              <article key={o.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3"><h2 className="min-w-0 font-semibold">{o.productName}</h2><span className="shrink-0 text-sm font-semibold text-primary">{o.qty} peti</span></div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{o.model}</p><p className="mt-3 text-sm">{o.storeName}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(o.date).toLocaleString("en-IN")}</p>
              </article>
            ))}</div>
            <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block"><table className="w-full text-sm">
              <thead className="text-left text-muted-foreground"><tr>{["Date", "Store", "Tile", "Model", "Peti"].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead>
              <tbody>{s.orders.map((o) => (
                <tr key={o.id} className="border-t border-border"><td className="p-4">{new Date(o.date).toLocaleString("en-IN")}</td><td className="p-4">{o.storeName}</td><td className="p-4">{o.productName}</td><td className="p-4 font-mono">{o.model}</td><td className="p-4 font-semibold">{o.qty}</td></tr>
              ))}</tbody>
            </table></div>
            {s.orders.length === 0 && <p className="p-8 text-center text-muted-foreground">Abhi koi order nahi.</p>}
          </div>
        )}

        {tab === "stores" && (
          <div className="mt-6 space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); if (st.name) run(async () => { await adminOps.addStore(st.name); setSt({ name: "" }); }); }} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:max-w-lg">
              <input className={inp} placeholder="Store name" value={st.name} onChange={(e) => setSt({ name: e.target.value })} />
              <Button className="h-11 px-3">Add store</Button>
            </form>
            {s.stores.map((x) => (
              <div key={x.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="min-w-0">{x.name}<p className="mt-1 text-sm text-muted-foreground">{s.orders.filter((o) => o.storeId === x.id).length} orders</p></div>
                <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-destructive" aria-label={`Delete ${x.name}`} title="Delete store" onClick={() => run(() => adminOps.deleteStore(x.id))}><Trash2 /></Button>
              </div>
            ))}

            <section className="min-w-0 border-t border-border pt-6">
              <p className="font-display text-xl">Staff Accounts</p>
              <p className="mt-1 text-sm text-muted-foreground">Staff member pehle Store Panel par sign up kare, phir yahan uska email store se jodein.</p>
              <form onSubmit={(e) => { e.preventDefault(); if (assign.email && assign.storeId) run(async () => { await adminOps.assignMember(assign.email, assign.storeId); setAssign({ email: "", storeId: "" }); await reloadMembers(); }); }} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <input className={inp} type="email" placeholder="Staff email" value={assign.email} onChange={(e) => setAssign({ ...assign, email: e.target.value })} />
                <select className={inp} value={assign.storeId} onChange={(e) => setAssign({ ...assign, storeId: e.target.value })}>
                  <option value="">Store chunein</option>
                  {s.stores.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <Button className="h-11 px-4">Assign</Button>
              </form>
              <div className="mt-4 space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                    <div className="min-w-0">{m.email}<p className="mt-1 text-muted-foreground">{m.storeName}</p></div>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-destructive" aria-label="Remove staff account" title="Remove staff account" onClick={() => run(async () => { await adminOps.removeMember(m.id); await reloadMembers(); })}><Trash2 /></Button>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-muted-foreground">Abhi koi staff account assign nahi hai.</p>}
              </div>
            </section>
          </div>
        )}

        {tab === "categories" && (
          <div className="mt-6 space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await adminOps.addCategory(cat); setCat(""); }); }} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:max-w-lg">
              <input className={inp} placeholder="New category" value={cat} onChange={(e) => setCat(e.target.value)} />
              <Button className="h-11 px-4">Add</Button>
            </form>
            <div className="flex flex-wrap gap-2">{s.categories.map((c) => (
              <span key={c} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-card pl-3 text-sm"><span className="min-w-0">{c}</span><Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-destructive" aria-label={`Delete ${c}`} title="Delete category" onClick={() => run(() => adminOps.deleteCategory(c))}><Trash2 /></Button></span>
            ))}</div>
          </div>
        )}
      </main>
    </div>
  );
}
