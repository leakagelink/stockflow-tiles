import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { actions, useInventory } from "@/lib/inventory";
import { Button } from "@/components/ui/button";

export function Header() {
  const s = useInventory();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:justify-between sm:px-6">
        <Link to="/" className="min-w-0 font-display text-2xl">Tile<span className="text-primary">Godown</span></Link>
        <nav aria-label="Main navigation" className="col-span-2 row-start-2 grid grid-cols-2 gap-2 text-sm sm:col-span-1 sm:row-auto sm:flex sm:items-center">
          <Button asChild variant="ghost" className="h-11"><Link to="/" activeProps={{ className: "bg-muted" }} activeOptions={{ exact: true }}>Store Panel</Link></Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/admin" activeProps={{ className: "bg-muted" }}>Admin</Link></Button>
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
