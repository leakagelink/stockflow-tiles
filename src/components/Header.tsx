import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl tracking-tight">Tile<span className="text-primary">Godown</span></Link>
        <nav className="flex gap-2 text-sm">
          <Link to="/" className="rounded-full px-4 py-2 hover:bg-muted" activeProps={{ className: "bg-muted" }} activeOptions={{ exact: true }}>Store Panel</Link>
          <Link to="/admin" className="rounded-full px-4 py-2 hover:bg-muted" activeProps={{ className: "bg-muted" }}>Admin</Link>
        </nav>
      </div>
    </header>
  );
}
