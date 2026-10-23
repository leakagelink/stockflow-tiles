import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, LogOut, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { TileAdvisor } from "@/components/TileAdvisor";
import { actions, useInventory, filterProducts, validateQty, type Product } from "@/lib/inventory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TileGodown — Live Tiles Stock for Every Store" },
      { name: "description", content: "Godown ka live tiles stock har store par. Search, categories aur account se order." },
      { property: "og:title", content: "TileGodown — Live Tiles Stock" },
      { property: "og:description", content: "Godown ka live tiles stock har store par, account se order." },
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

  const store = s.store;
  const list = useMemo(() => filterProducts(s.products, q, cat), [s.products, q, cat]);
  const total = s.products.reduce((a, p) => a + p.stock, 0);

  return (
    <div className="min-h-screen">
      <Header />
      <section className="relative overflow-hidden border-b border-border">
        <div className="tile-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 sm:py-12 md:grid-cols-[1.4fr_1fr] md:gap-10 md:py-20">
          <div className="min-w-0">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Ek Godown · Sabhi Stores</p>
            <h1 className="font-display text-4xl leading-[1.1] sm:text-5xl md:text-7xl">Har store par<br />wahi <em className="text-primary">live stock.</em></h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:mt-6 sm:text-lg">Kisi bhi store se order aaye, godown ka stock turant ghat jaata hai — aur sab stores ko naya stock dikhta hai.</p>
            <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-8">
              <Stat n={s.products.length} l="Designs" /><Stat n={total} l="Peti in godown" /><Stat n={s.stores.length} l="Stores" />
            </div>
          </div>
          <div className="min-w-0 self-center rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-6">
            {store ? (
              <div>
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-display text-2xl">{store.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.userEmail}</p>
                <p className="mt-3 text-sm text-muted-foreground">Aapke orders: {s.orders.filter((o) => o.storeId === store.id).length}</p>
                <Button variant="outline" onClick={() => void actions.signOut()} className="mt-4 h-11"><LogOut />Logout</Button>
              </div>
            ) : s.userEmail ? (
              <div>
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-display text-2xl">{s.userEmail}</p>
                <p className="mt-3 text-sm text-muted-foreground">Aapka account abhi kisi store se juda nahi hai. Admin se apna store assign karwayein, phir order kar payenge.</p>
                <Button variant="outline" onClick={() => void actions.signOut()} className="mt-4 h-11"><LogOut />Logout</Button>
              </div>
            ) : <AuthForm />}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-12">
        {store && <div className="mb-10"><TileAdvisor onOrder={setOrdering} /></div>}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tile ka naam ya model number search karein…" className="w-full rounded-full border border-input bg-card py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            {["All", ...s.categories].map((c) => (
              <Button key={c} variant={cat === c ? "default" : "outline"} aria-pressed={cat === c} onClick={() => setCat(c)} className={`h-auto min-h-11 max-w-full whitespace-normal rounded-full px-4 py-2 ${cat === c ? "bg-foreground text-background hover:bg-foreground hover:text-background" : ""}`}>{c}</Button>
            ))}
          </div>
        </div>

        {s.loading && <p className="mt-8 text-center text-muted-foreground">Stock load ho raha hai…</p>}
        <div className="mt-5 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className="group min-w-0 overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-[var(--shadow-soft)]">
              <Button variant="ghost" onClick={() => setDetail(p)} aria-label={`${p.name} detail dekhein`} className="block h-auto w-full whitespace-normal rounded-none p-0 text-left font-normal hover:bg-transparent">
              <div className="relative h-44 sm:h-48" style={{ background: p.color }}>
                <div className="tile-grid absolute inset-0 opacity-40" />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs">{p.category}</span>
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${p.stock === 0 ? "bg-destructive text-destructive-foreground" : p.stock < 20 ? "bg-warning text-foreground" : "bg-primary text-primary-foreground"}`}>{p.stock === 0 ? "Out of stock" : `${p.stock} peti`}</span>
              </div>
              <div className="p-5">
                <p className="text-xs font-mono text-muted-foreground">{p.model} · {p.size}</p>
                <h3 className="mt-1 font-display text-xl">{p.name}</h3>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="font-semibold">₹{p.price}<span className="text-xs font-normal text-muted-foreground"> /peti</span></span>
                  <span className="text-sm text-primary underline underline-offset-4">Detail dekhein</span>
                </div>
              </div>
              </Button>
            </article>
          ))}
          {list.length === 0 && !s.loading && <p className="col-span-full py-16 text-center text-muted-foreground">Koi tile nahi mili.</p>}
        </div>
      </main>
      {detail && !ordering && <ProductDetail p={detail} canOrder={!!store} onOrder={() => setOrdering(detail)} onClose={() => setDetail(null)} />}
      {ordering && store && <OrderDialog p={ordering} onClose={() => { setOrdering(null); setDetail(null); }} />}
    </div>
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return <div className="min-w-0"><p className="font-display text-2xl sm:text-3xl">{n}</p><p className="text-xs uppercase text-muted-foreground">{l}</p></div>;
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
          if (needsConfirm) setInfo("Account ban gaya! Apne email par confirmation link kholein, phir sign in karein.");
        }
      } catch (x) { setErr((x as Error).message); }
      finally { setBusy(false); }
    }}>
      <p className="font-display text-2xl">{mode === "in" ? "Staff Sign In" : "Staff Sign Up"}</p>
      <p className="mb-4 text-sm text-muted-foreground">Apna email aur password daalein</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" aria-label="Email" required placeholder="Email" className="mb-3 min-w-0 w-full rounded-lg border border-input bg-background p-3" />
      <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} aria-label="Password" required minLength={6} placeholder="Password (kam se kam 6 akshar)" className="mb-3 min-w-0 w-full rounded-lg border border-input bg-background p-3" />
      {err && <p className="mb-2 text-sm text-destructive">{err}</p>}
      {info && <p className="mb-2 text-sm text-primary">{info}</p>}
      <Button disabled={busy} className="h-12 w-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Sign In" : "Sign Up"}</Button>
      <Button variant="link" type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }} className="mt-2 h-auto min-h-11 w-full whitespace-normal text-center text-sm text-muted-foreground underline">
        {mode === "in" ? "Naya account banayein (Sign Up)" : "Pehle se account hai? Sign In"}
      </Button>
    </form>
  );
}

function ProductDetail({ p, canOrder, onOrder, onClose }: { p: Product; canOrder: boolean; onOrder: () => void; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Model No.", p.model || "—"],
    ["Category", p.category],
    ["Size", p.size || "—"],
    ["Price", `₹${p.price.toLocaleString("en-IN")} /peti`],
    ["Godown Stock", p.stock === 0 ? "Out of stock" : `${p.stock} peti`],
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
            {canOrder ? (p.stock === 0 ? "Stock khatam" : "Order Karein") : "Order ke liye login karein"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderDialog({ p, onClose }: { p: Product; onClose: () => void }) {
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
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="block max-w-sm bg-card p-4 sm:p-6">
        {done ? (
          <div className="text-center"><Package className="mx-auto h-10 w-10 text-primary" /><DialogTitle className="mt-3 font-display text-2xl">Order ho gaya!</DialogTitle><p className="text-sm text-muted-foreground">Stock sabhi stores par update ho gaya.</p><Button onClick={onClose} className="mt-5 h-11 px-6">OK</Button></div>
        ) : (
          <>
            <p className="pr-12 text-xs font-mono text-muted-foreground">{p.model}</p>
            <DialogTitle className="pr-10 font-display text-2xl leading-snug">{p.name}</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">Godown stock: {p.stock} peti</p>
            <label htmlFor="order-qty" className="mt-4 block text-sm">Kitni peti?</label>
            <input id="order-qty" type="number" inputMode="numeric" min={1} max={p.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mt-1 min-w-0 w-full rounded-lg border border-input bg-background p-3" />
            <p className="mt-2 text-sm">Total: ₹{(qty * p.price).toLocaleString("en-IN")}</p>
            {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onClose} className="h-12">Cancel</Button>
              <Button onClick={submit} disabled={busy} className="h-12 px-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Order Karein</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
