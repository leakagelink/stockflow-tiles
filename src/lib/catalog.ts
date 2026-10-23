export type Product = { id: string; name: string; model: string; category: string; size: string; price: number; stock: number; color: string };
export type Store = { id: string; name: string };
export type Order = { id: string; storeId: string; storeName: string; productId: string; productName: string; model: string; qty: number; date: string };

/** Pure rule: catalog filtering by category and by tile name or model number. */
export function filterProducts(products: Product[], q: string, cat: string): Product[] {
  const t = q.trim().toLowerCase();
  return products.filter(
    (p) => (cat === "All" || p.category === cat) && (!t || p.name.toLowerCase().includes(t) || p.model.toLowerCase().includes(t)),
  );
}

/** Pure rule: order quantity must be a whole number of peti and cannot exceed godown stock. */
export function validateQty(qty: number, stock: number): string | null {
  if (!Number.isInteger(qty) || qty <= 0) return "Enter a positive whole number of boxes.";
  if (qty > stock) return `Only ${stock} boxes available.`;
  return null;
}
