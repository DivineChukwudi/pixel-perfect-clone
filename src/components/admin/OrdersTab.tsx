import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/adminDb";
import { formatMaloti } from "@/config/siteConfig";

type OrderItem = { id: string; product_name: string; unit_price: number; quantity: number };
type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  order_type: string;
  total: number;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  order_items: OrderItem[];
};

const FILTERS = [
  { key: "awaiting_confirmation", label: "Awaiting payment" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
] as const;

const statusStyle: Record<string, string> = {
  awaiting_confirmation: "border-primary text-primary",
  pending: "border-primary text-primary",
  paid: "border-[var(--success)] text-[var(--success)]",
  failed: "border-destructive text-destructive",
};

export function OrdersTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("awaiting_confirmation");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-orders"],
    refetchInterval: 15000,
    queryFn: async (): Promise<Order[]> => {
      const { data: rows, error: dbError } = await adminDb
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(150);
      if (dbError) throw new Error(dbError.message);
      return (rows ?? []) as Order[];
    },
  });

  const setStatus = async (id: string, payment_status: string) => {
    const { error: dbError } = await adminDb.from("orders").update({ payment_status }).eq("id", id);
    if (dbError) {
      toast.error(dbError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const orders = (data ?? []).filter((o) =>
    filter === "all" ? true : filter === "awaiting_confirmation"
      ? o.payment_status === "awaiting_confirmation" || o.payment_status === "pending"
      : o.payment_status === filter,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm ${
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void refetch()}>
          {isFetching ? "Refreshing…" : "Refresh"} (auto every 15s)
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading orders…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {!isLoading && orders.length === 0 && <p className="text-muted-foreground">No orders here yet.</p>}

      {orders.map((o) => (
        <article key={o.id} className="gold-frame flex flex-col gap-3 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl text-primary">{o.order_number}</h3>
            <span className={`rounded-full border px-3 py-0.5 text-xs ${statusStyle[o.payment_status] ?? ""}`}>
              {o.payment_status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(o.created_at).toLocaleString("en-ZA")} · {o.order_type === "eat_in" ? "Eat-in" : "Takeaway"} ·{" "}
            {o.payment_method ?? "n/a"}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{o.customer_name}</span> ·{" "}
            <a href={`tel:${o.phone}`} className="text-primary underline-offset-4 hover:underline">
              {o.phone}
            </a>
          </p>
          <ul className="text-sm text-muted-foreground">
            {o.order_items.map((i) => (
              <li key={i.id}>
                {i.quantity} × {i.product_name} — {formatMaloti(Number(i.unit_price) * i.quantity)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <span className="font-display text-xl">{formatMaloti(Number(o.total))}</span>
            <div className="flex gap-2">
              {o.payment_status !== "paid" && (
                <Button variant="gold" size="sm" className="rounded-full" onClick={() => void setStatus(o.id, "paid")}>
                  Mark paid
                </Button>
              )}
              {o.payment_status !== "failed" && (
                <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void setStatus(o.id, "failed")}>
                  Mark failed
                </Button>
              )}
              {(o.payment_status === "paid" || o.payment_status === "failed") && (
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => void setStatus(o.id, "awaiting_confirmation")}>
                  Undo
                </Button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
