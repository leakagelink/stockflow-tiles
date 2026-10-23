import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, LogOut, Package, Loader2, X } from "lucide-react";
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
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr] md:py-24">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Ek Godown · Sabhi Stores</p>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">Har store par<br />wahi <em className="text-primary">live stock.</em></h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">Kisi bhi store se order aaye, godown ka stock turant ghat jaata hai — aur sab stores ko naya stock dikhta hai.</p>
            <div className="mt-8 flex gap-8">
              <Stat n={s.products.length} l="Designs" /><Stat n={total} l="Peti in godown" /><Stat n={s.stores.length} l="Stores" />
            </div>
          </div>
          <div className="self-center rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            {store ? (
              <div>
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-display text-2xl">{store.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.userEmail}</p>
                <p className="mt-3 text-sm text-muted-foreground">Aapke orders: {s.orders.filter((o) => o.storeId === store.id).length}</p>
                <button onClick={() => void actions.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"><LogOut className="h-4 w-4" />Logout</button>
              </div>
            ) : s.userEmail ? (
              <div>
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-display text-2xl">{s.userEmail}</p>
                <p className="mt-3 text-sm text-muted-foreground">Aapka account abhi kisi store se juda nahi hai. Admin se apna store assign karwayein, phir order kar payenge.</p>
                <button onClick={() => void actions.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"><LogOut className="h-4 w-4" />Logout</button>
              </div>
            ) : <AuthForm />}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12">
        {store && <div className="mb-10"><TileAdvisor onOrder={setOrdering} /></div>}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tile ka naam ya model number search karein…" className="w-full rounded-full border border-input bg-card py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...s.categories].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-2 text-sm transition ${cat === c ? "bg-foreground text-background" : "border border-border hover:bg-muted"}`}>{c}</button>
            ))}
          </div>
        </div>

        {s.loading && <p className="mt-8 text-center text-muted-foreground">Stock load ho raha hai…</p>}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} onClick={() => setDetail(p)} className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
              <div className="relative h-44" style={{ background: p.color }}>
                <div className="tile-grid absolute inset-0 opacity-40" />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs">{p.category}</span>
                <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${p.stock === 0 ? "bg-destructive text-destructive-foreground" : p.stock < 20 ? "bg-warning text-foreground" : "bg-primary text-primary-foreground"}`}>{p.stock === 0 ? "Out of stock" : `${p.stock} peti`}</span>
              </div>
              <div className="p-5">
                <p className="text-xs font-mono text-muted-foreground">{p.model} · {p.size}</p>
                <h3 className="mt-1 font-display text-xl">{p.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">₹{p.price}<span className="text-xs font-normal text-muted-foreground"> /peti</span></span>
                  <span className="text-sm text-primary underline underline-offset-4">Detail dekhein</span>
                </div>
              </div>
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
  return <div><p className="font-display text-3xl">{n}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p></div>;
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
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email" className="mb-3 w-full rounded-xl border border-input bg-background p-3" />
      <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" required minLength={6} placeholder="Password (kam se kam 6 akshar)" className="mb-3 w-full rounded-xl border border-input bg-background p-3" />
      {err && <p className="mb-2 text-sm text-destructive">{err}</p>}
      {info && <p className="mb-2 text-sm text-primary">{info}</p>}
      <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Sign In" : "Sign Up"}</button>
      <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }} className="mt-3 w-full text-center text-sm text-muted-foreground underline">
        {mode === "in" ? "Naya account banayein (Sign Up)" : "Pehle se account hai? Sign In"}
      </button>
    </form>
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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center"><Package className="mx-auto h-10 w-10 text-primary" /><p className="mt-3 font-display text-2xl">Order ho gaya!</p><p className="text-sm text-muted-foreground">Stock sabhi stores par update ho gaya.</p><button onClick={onClose} className="mt-5 rounded-full bg-primary px-6 py-2 text-primary-foreground">OK</button></div>
        ) : (
          <>
            <p className="text-xs font-mono text-muted-foreground">{p.model}</p>
            <h3 className="font-display text-2xl">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Godown stock: {p.stock} peti</p>
            <label className="mt-4 block text-sm">Kitni peti?</label>
            <input type="number" min={1} max={p.stock} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-input bg-background p-3" />
            <p className="mt-2 text-sm">Total: ₹{(qty * p.price).toLocaleString("en-IN")}</p>
            {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3">Cancel</button>
              <button onClick={submit} disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-primary-foreground disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Order Karein</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
