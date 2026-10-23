import { Package, ArrowUpRight, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderStatuses, type Product } from "@/lib/catalog";
import { refresh, useInventory } from "@/lib/inventory";

export function CustomerOrders({ onDetail }: { onDetail: (product: Product) => void }) {
  const s = useInventory();
  const orders = s.orders.filter((order) => order.storeId === s.store?.id);
  return (
    <section className="mt-6" aria-label="My orders">
      <div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl">My orders</h2><Button variant="outline" size="icon" title="Refresh orders" aria-label="Refresh orders" onClick={() => void refresh()} className="h-11 w-11"><RefreshCw className="h-4 w-4" /></Button></div>
      {s.ordersError ? <p role="alert" className="mt-4 text-sm text-destructive">{s.ordersError}</p> : orders.length === 0 ? <div className="py-16 text-center text-muted-foreground"><Package className="mx-auto mb-3 h-8 w-8" /><p>No orders yet.</p></div> : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {orders.map((order) => {
            const product = s.products.find((p) => p.id === order.productId);
            const step = orderStatuses.indexOf(order.status);
            return <article key={order.id} className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p><h3 className="mt-2 font-semibold">{order.productName}</h3><p className="mt-1 text-xs text-muted-foreground">{order.model}{product?.size ? ` · ${product.size}` : ""}</p></div><span className="self-start rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold capitalize text-primary">{order.status}</span></div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-sm"><div><p className="text-xs text-muted-foreground">Ordered</p><p className="mt-1 font-semibold">{order.qty} boxes</p></div><div><p className="text-xs text-muted-foreground">Live stock</p><p className="mt-1 font-semibold">{product ? `${product.stock} boxes` : "Unavailable"}</p></div></div>
              <ol aria-label="Order progress" className="mt-4 grid grid-cols-4 gap-1">
                {orderStatuses.map((status, i) => <li key={status} aria-current={i === step ? "step" : undefined} className={`min-w-0 text-center ${i <= step ? "text-primary" : "text-muted-foreground"}`}><div className={`mb-2 flex h-7 items-center justify-center rounded-sm ${i <= step ? "bg-primary/10" : "bg-muted"}`}>{i < step ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}</div><span className="text-[10px] capitalize sm:text-xs">{status}</span></li>)}
              </ol>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><time dateTime={order.date} className="text-xs text-muted-foreground">{new Date(order.date).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>{product && <Button variant="ghost" onClick={() => onDetail(product)} className="h-11 px-2 text-primary">Tile details<ArrowUpRight className="h-4 w-4" /></Button>}</div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}