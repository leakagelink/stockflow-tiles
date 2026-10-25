import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Layers, Loader2, Boxes, Store, ShoppingBag } from "lucide-react";
import warehouse from "@/assets/warehouse.jpg";
import { AuthForm } from "@/components/AuthForm";
import { useInventory } from "@/lib/inventory";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TileGodown" },
      { name: "description", content: "Sign in to TileGodown to browse live tile stock, place orders and track your store's orders." },
      { property: "og:title", content: "Sign in — TileGodown" },
      { property: "og:description", content: "Live tile inventory and ordering for every store." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const s = useInventory();
  const navigate = useNavigate();

  useEffect(() => {
    if (!s.loading && s.userEmail) void navigate({ to: "/", replace: true });
  }, [s.loading, s.userEmail, navigate]);

  if (s.loading || s.userEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <img src={warehouse} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div className="warehouse-overlay absolute inset-0" />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="flex items-center justify-center gap-2 font-display text-3xl">
            <Layers className="h-9 w-9 text-primary" />Tile<span className="text-primary">Godown</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Live tile inventory and ordering for every store</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <AuthForm onSuccess={() => void navigate({ to: "/", replace: true })} />
        </div>
        <div className="mt-8 grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-2"><Boxes className="mx-auto h-5 w-5 text-primary" /><p className="mt-1 text-xs text-muted-foreground">Live stock</p></div>
          <div className="px-2"><ShoppingBag className="mx-auto h-5 w-5 text-primary" /><p className="mt-1 text-xs text-muted-foreground">Easy ordering</p></div>
          <div className="px-2"><Store className="mx-auto h-5 w-5 text-primary" /><p className="mt-1 text-xs text-muted-foreground">Every store</p></div>
        </div>
      </main>
    </div>
  );
}
