import { Link } from "@tanstack/react-router";
import { LogOut, Grid2X2, Layers } from "lucide-react";
import { actions, useInventory } from "@/lib/inventory";
import { Button } from "@/components/ui/button";

export function Header() {
  const s = useInventory();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:justify-between sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-xl"><Layers className="h-6 w-6 shrink-0 text-primary" />Tile<span className="text-primary">Godown</span></Link>
        <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex gap-2 text-sm sm:col-span-1 sm:row-auto sm:items-center">
          <Button asChild variant="ghost" className="h-11"><Link to="/" activeProps={{ className: "bg-muted" }} activeOptions={{ exact: true }}><Grid2X2 className="h-4 w-4" />Customer Panel</Link></Button>
        </nav>
          {s.userEmail && (
            <Button variant="outline" onClick={() => void actions.signOut()} title="Sign out" aria-label="Sign out" className="col-start-2 row-start-1 h-11 shrink-0 px-3 sm:order-last">
              <LogOut /><span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
      </div>
    </header>
  );
}
