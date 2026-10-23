import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { actions, useInventory } from "@/lib/inventory";

export function Header() {
  const s = useInventory();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl tracking-tight">Tile<span className="text-primary">Godown</span></Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="rounded-full px-4 py-2 hover:bg-muted" activeProps={{ className: "bg-muted" }} activeOptions={{ exact: true }}>Store Panel</Link>
          <Link to="/admin" className="rounded-full px-4 py-2 hover:bg-muted" activeProps={{ className: "bg-muted" }}>Admin</Link>
          {s.userEmail && (
            <button onClick={() => void actions.signOut()} title={s.userEmail} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 hover:bg-muted">
              <LogOut className="h-3.5 w-3.5" />Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
