import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Package, Loader2, ArrowUpRight, Store, Boxes, Sparkles, Grid2X2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import warehouse from "@/assets/warehouse.jpg";
import { Header } from "@/components/Header";
import { BottomBar } from "@/components/BottomBar";
import { TileAdvisor } from "@/components/TileAdvisor";
import { CustomerOrders } from "@/components/CustomerOrders";
import { actions, useInventory, filterProducts, validateQty, type Product } from "@/lib/inventory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Customer Panel — TileGodown" },
      { name: "description", content: "Browse tile details, check live stock, place orders and track your store's order status." },
      { property: "og:title", content: "Customer Panel — TileGodown" },
      { property: "og:description", content: "Tile details, live warehouse stock and order tracking for your store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const s = useInventory();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [ordering, setOrdering] = useState<Product | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [view, setView] = useState<"catalog" | "orders">("catalog");
  const liveDetail = detail ? s.products.find((p) => p.id === detail.id) ?? detail : null;
  const liveOrdering = ordering ? s.products.find((p) => p.id === ordering.id) ?? { ...ordering, stock: 0 } : null;

  const store = s.store;
  const list = useMemo(() => filterProducts(s.products, q, cat), [s.products, q, cat]);
  const total = s.products.reduce((a, p) => a + p.stock, 0);

  return (
    <div className="min-h-screen pb-[4.25rem] sm:pb-0">
      <Header />
      <section className="relative overflow-hidden border-b border-border">
        <img src={warehouse} alt="Tile warehouse" width={1536} height={512} className="absolute inset-0 h-full w-full object-cover" />
        <div className="warehouse-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> LIVE INVENTORY</p><h1 className="font-display text-3xl sm:text-4xl">TileGodown</h1><p className="mt-2 text-sm text-muted-foreground">{store?.name ?? "Tile collection"}</p></div>
            <Boxes className="h-8 w-8 shrink-0 text-primary sm:h-10 sm:w-10" />
          </div>
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-7 grid grid-cols-3 divide-x divide-border border-b border-border pb-6">
          <Stat n={s.products.length} l="Tile designs" /><Stat n={total} l="Boxes available" /><Stat n={s.stores.length} l="Stores" />
        </div>
        {!s.userEmail && <section id="auth" className="mb-8 scroll-mt-20 border-b border-border pb-6"><AuthForm /></section>}
        {s.userEmail && !store && <p className="mb-6 rounded-lg border border-warning bg-warning/15 p-4 text-sm">Store assignment pending. Contact your store manager to start ordering.</p>}
        {store && <div className="mb-6 hidden gap-2 border-b border-border pb-5 sm:flex"><Button variant={view === "catalog" ? "default" : "outline"} aria-pressed={view === "catalog"} className="h-12" onClick={() => setView("catalog")}><Grid2X2 className="h-4 w-4" />Tile catalog</Button><Button variant={view === "orders" ? "default" : "outline"} aria-pressed={view === "orders"} className="h-12" onClick={() => setView("orders")}><ShoppingBag className="h-4 w-4" />My orders<span className="text-xs">({s.orders.filter((o) => o.storeId === store.id).length})</span></Button></div>}
        {view === "orders" && store ? <CustomerOrders onDetail={setDetail} /> : <>
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><h2 className="font-display text-2xl">Explore tiles</h2><p className="mt-1 text-sm text-muted-foreground">{list.length} designs{cat !== "All" ? ` · ${cat}` : ""}</p></div>{store && <span className="flex items-center gap-2 text-xs text-primary"><Store className="h-4 w-4" /><span className="hidden sm:inline">Ready to order</span></span>}</div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by tile name or model…" aria-label="Search tiles" className="w-full rounded-lg border border-input bg-card py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {["All", ...s.categories].map((c) => (
              <Button key={c} variant={cat === c ? "default" : "outline"} aria-pressed={cat === c} onClick={() => setCat(c)} className={`h-auto min-h-11 max-w-full whitespace-normal rounded-lg px-4 py-2 ${cat === c ? "bg-foreground text-background hover:bg-foreground hover:text-background" : ""}`}>{c}</Button>
            ))}
          </div>
        </div>

        {s.loading && <p className="mt-8 text-center text-muted-foreground">Loading inventory…</p>}
        <div className="mt-5 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className="group min-w-0 overflow-hidden rounded-lg border border-border bg-card transition hover:shadow-[var(--shadow-soft)]">
              <Button variant="ghost" onClick={() => setDetail(p)} aria-label={`View ${p.name} details`} className="block h-auto w-full whitespace-normal rounded-none p-0 text-left font-normal hover:bg-transparent">
              <div className="relative h-44 sm:h-48" style={{ background: p.color }}>
                <div className="tile-grid absolute inset-0 opacity-40" />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs">{p.category}</span>
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${p.stock === 0 ? "bg-destructive text-destructive-foreground" : p.stock < 20 ? "bg-warning text-foreground" : "bg-primary text-primary-foreground"}`}>{p.stock === 0 ? "Out of stock" : `${p.stock} boxes`}</span>
              </div>
              <div className="p-5">
                <p className="text-xs font-mono text-muted-foreground">{p.model} · {p.size}</p>
                <h3 className="mt-1 font-display text-lg">{p.name}</h3>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="font-semibold">₹{p.price}<span className="text-xs font-normal text-muted-foreground"> /box</span></span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">View details <ArrowUpRight className="h-4 w-4" /></span>
                </div>
              </div>
              </Button>
            </article>
          ))}
          {list.length === 0 && !s.loading && <p className="col-span-full py-16 text-center text-muted-foreground">No tiles found. Try a different search or category.</p>}
        </div>
        {store && <details className="mt-8 border-t border-border pt-5"><summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />Tile advisor</summary><TileAdvisor onOrder={(p) => setDetail(p)} /></details>}
        </>}
      </main>
      <BottomBar view={view} onView={setView} />
      {liveDetail && !ordering && <ProductDetail p={liveDetail} canOrder={!!store} onOrder={() => setOrdering(liveDetail)} onClose={() => setDetail(null)} />}
      {liveOrdering && store && <OrderDialog p={liveOrdering} onTrack={() => { setOrdering(null); setDetail(null); setView("orders"); }} onClose={() => { setOrdering(null); setDetail(null); }} />}
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="min-w-0 px-3 first:pl-0 sm:px-6"><p className="font-display text-2xl sm:text-3xl">{n.toLocaleString("en-IN")}</p><p className="text-xs uppercase text-muted-foreground">{l}</p></div>;
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true); setErr(""); setInfo("");
      try {
        if (mode === "in") {
          await actions.signIn(email, pass);
        } else {
          const needsConfirm = await actions.signUp(email, pass);
          if (needsConfirm) setInfo("Account created. Check your email to confirm your account, then sign in.");
        }
      } catch (x) { setErr((x as Error).message); }
      finally { setBusy(false); }
    }}>
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-xl">{mode === "in" ? "Customer sign in" : "Create customer account"}</h2><Button variant="link" type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }} className="h-11 shrink-0 px-0">{mode === "in" ? "Create account" : "Sign in instead"}</Button></div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" aria-label="Email" required placeholder="Email address" className="min-w-0 w-full rounded-lg border border-input bg-card p-3" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} aria-label="Password" required minLength={6} placeholder="Password" className="min-w-0 w-full rounded-lg border border-input bg-card p-3" />
        <Button disabled={busy} className="h-12 px-6">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Sign In" : "Create account"}<ArrowUpRight className="h-4 w-4" /></Button>
      </div>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {info && <p className="mt-3 text-sm text-primary">{info}</p>}
    </form>
  );
}

function ProductDetail({ p, canOrder, onOrder, onClose }: { p: Product; canOrder: boolean; onOrder: () => void; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Model No.", p.model || "—"],
    ["Category", p.category],
    ["Size", p.size || "—"],
    ["Price", `₹${p.price.toLocaleString("en-IN")} /box`],
    ["Available stock", p.stock === 0 ? "Out of stock" : `${p.stock} boxes`],
  ];
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="block max-w-md overflow-x-hidden bg-card p-0">
        <div className="relative h-40 sm:h-56" style={{ background: p.color }}>
          <div className="tile-grid absolute inset-0 opacity-40" />
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs">{p.category}</span>
        </div>
        <div className="p-4 sm:p-6">
          <DialogTitle className="font-display text-2xl leading-snug sm:text-3xl">{p.name}</DialogTitle>
          <div className="mt-4 divide-y divide-border">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-3 py-3 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="min-w-0 text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
          <Button
            disabled={!canOrder || p.stock === 0}
            onClick={onOrder}
            className="mt-4 h-auto min-h-12 w-full whitespace-normal"
          >
            {canOrder ? (p.stock === 0 ? "Out of stock" : "Place order") : "Sign in to order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderDialog({ p, onClose, onTrack }: { p: Product; onClose: () => void; onTrack: () => void }) {
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit() {
    if (busy) return;
    const v = validateQty(qty, p.stock);
    if (v) { setErr(v); return; }
    setErr(""); setBusy(true);
    try {
      await actions.placeOrder(p.id, qty);
      setDone(true);
    } catch { setErr("Unable to place your order. Check availability and try again."); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="block max-w-sm bg-card p-4 sm:p-6">
        {done ? (
          <div className="text-center"><Package className="mx-auto h-10 w-10 text-primary" /><DialogTitle className="mt-3 font-display text-2xl">Order confirmed</DialogTitle><p className="mt-2 text-sm text-muted-foreground">{qty} boxes reserved. Stock updated.</p><Button onClick={onTrack} className="mt-5 h-12 w-full"><ShoppingBag className="h-4 w-4" />Track order</Button></div>
        ) : (
          <>
            <p className="pr-12 text-xs font-mono text-muted-foreground">{p.model}</p>
            <DialogTitle className="pr-10 font-display text-2xl leading-snug">{p.name}</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">Available: {p.stock} boxes</p>
            <label htmlFor="order-qty" className="mt-4 block text-sm">Quantity (boxes)</label>
            <input id="order-qty" type="number" inputMode="numeric" min={1} max={p.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mt-1 min-w-0 w-full rounded-lg border border-input bg-background p-3" />
            <p className="mt-2 text-sm">Total: ₹{(qty * p.price).toLocaleString("en-IN")}</p>
            {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onClose} className="h-12">Cancel</Button>
              <Button onClick={submit} disabled={busy} className="h-12 px-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Place order</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
