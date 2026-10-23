import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { suggestTiles } from "@/lib/suggest.functions";
import { useInventory, type Product } from "@/lib/inventory";
import { Button } from "@/components/ui/button";

const inp = "min-w-0 w-full rounded-lg border border-input bg-background p-3 text-base sm:text-sm";

export function TileAdvisor({ onOrder }: { onOrder: (p: Product) => void }) {
  const s = useInventory();
  const run = useServerFn(suggestTiles);
  const [pref, setPref] = useState("");
  const [room, setRoom] = useState("Living Room");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ summary: string; picks: { id: string; reason: string }[] } | null>(null);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await run({ data: { preference: pref, room, budget: Number(budget) || 0, catalog: s.products } });
      if (r.ok) setRes(r); else setErr(r.error);
    } catch { setErr("Suggestion nahi mil paaya, dobara try karein."); }
    finally { setBusy(false); }
  }

  return (
    <section className="min-w-0 border-y border-border py-5 sm:py-6">
      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl">AI Tile Advisor</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">Grahak ki pasand, kamra aur budget batayein — catalog se matching tiles milengi.</p>
      <form onSubmit={submit} className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <input className={inp} value={pref} onChange={(e) => setPref(e.target.value)} placeholder="Pasand: jaise light colour, marble look, glossy…" required />
        <select className={inp} value={room} onChange={(e) => setRoom(e.target.value)}>
          {["Living Room", "Bedroom", "Kitchen", "Bathroom", "Outdoor / Parking", "Office"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <input className={inp} type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget ₹/peti" />
        <Button disabled={busy} className="h-12 px-5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Suggest
        </Button>
      </form>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {res && (
        <div className="mt-5">
          <p className="text-sm">{res.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {res.picks.map((pk) => {
              const p = s.products.find((x) => x.id === pk.id);
              if (!p) return null;
              return (
                <div key={p.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border border-border p-3 sm:p-4">
                  <div className="h-16 w-16 shrink-0 rounded-xl" style={{ background: p.color }} />
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{p.model} · ₹{p.price} · {p.stock} peti</p>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{pk.reason}</p>
                    <Button variant="link" onClick={() => onOrder(p)} className="mt-1 h-11 px-0 underline">Order karein</Button>
                  </div>
                </div>
              );
            })}
            {res.picks.length === 0 && <p className="text-sm text-muted-foreground">Catalog mein koi matching tile nahi mili.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
