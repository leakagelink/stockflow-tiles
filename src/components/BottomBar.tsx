import { Grid2X2, ShoppingBag, LogOut } from "lucide-react";
import { actions, useInventory } from "@/lib/inventory";

export function BottomBar({ view, onView }: { view: "catalog" | "orders"; onView: (v: "catalog" | "orders") => void }) {
  const s = useInventory();
  const store = s.store;
  const orderCount = store ? s.orders.filter((o) => o.storeId === store.id).length : 0;
  const base = "flex min-h-14 flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg text-[0.6875rem] font-medium leading-tight";
  const active = "text-primary";
  const idle = "text-muted-foreground";

  return (
    <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-stretch gap-1 px-2 py-1.5">
        <button type="button" aria-pressed={view === "catalog"} onClick={() => onView("catalog")} className={`${base} ${view === "catalog" ? active : idle}`}>
          <Grid2X2 className="h-5 w-5" />Catalog
        </button>
        {store && (
          <button type="button" aria-pressed={view === "orders"} onClick={() => onView("orders")} className={`${base} relative ${view === "orders" ? active : idle}`}>
            <ShoppingBag className="h-5 w-5" />My orders
            {orderCount > 0 && <span className="absolute right-3 top-1 rounded-full bg-primary px-1.5 text-[0.625rem] font-semibold text-primary-foreground">{orderCount}</span>}
          </button>
        )}
        {s.userEmail && (
          <button type="button" onClick={() => void actions.signOut()} className={`${base} ${idle}`}>
            <LogOut className="h-5 w-5" />Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
