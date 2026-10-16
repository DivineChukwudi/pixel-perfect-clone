import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { adminDb } from "@/lib/adminDb";
import { formatMaloti } from "@/config/siteConfig";
import { RefreshCw, Package, Truck, User, CreditCard, ChevronDown, SortAsc, SortDesc } from "lucide-react";

type OrderItem = { id: string; product_name: string; unit_price: number; quantity: number };
type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  order_type: string;
  delivery_address: string | null;
  delivery_fee: number | null;
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

type SortKey = "date" | "total";
type SortOrder = "asc" | "desc";

const statusStyle: Record<string, string> = {
  awaiting_confirmation: "bg-primary/20 text-primary border-primary/50",
  pending: "bg-primary/20 text-primary border-primary/50",
  paid: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/50",
  failed: "bg-destructive/20 text-destructive border-destructive/50",
};

export function OrdersTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("awaiting_confirmation");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  let orders = (data ?? []).filter((o) =>
    filter === "all" ? true : filter === "awaiting_confirmation"
      ? o.payment_status === "awaiting_confirmation" || o.payment_status === "pending"
      : o.payment_status === filter,
  );

  orders = [...orders].sort((a, b) => {
    if (sortKey === "date") {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    } else {
      const totalA = Number(a.total);
      const totalB = Number(b.total);
      return sortOrder === "desc" ? totalB - totalA : totalA - totalB;
    }
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              type="button"
              variant={filter === f.key ? "gold" : "goldOutline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="rounded-full"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("date")}
            className={`rounded-full ${sortKey === "date" ? "text-primary" : "text-muted-foreground"}`}
          >
            Date {sortKey === "date" && (sortOrder === "desc" ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("total")}
            className={`rounded-full ${sortKey === "total" ? "text-primary" : "text-muted-foreground"}`}
          >
            Total {sortKey === "total" && (sortOrder === "desc" ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />)}
          </Button>
          <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Orders refresh automatically every 15 seconds.</p>

      {isLoading && <p className="text-muted-foreground">Loading orders…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {!isLoading && orders.length === 0 && <p className="text-muted-foreground">No orders here yet.</p>}

      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {orders.map((o) => (
          <AccordionItem key={o.id} value={o.id} className="gold-frame overflow-hidden rounded-2xl border-none">
            <AccordionTrigger className="flex flex-col items-start gap-2 px-5 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl text-primary">{o.order_number}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle[o.payment_status] ?? ""}`}>
                    {o.payment_status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg">{formatMaloti(Number(o.total))}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {o.customer_name}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> {o.order_type === "eat_in" ? "Eat-in" : o.order_type === "delivery" ? "Delivery" : "Takeaway"}
                </span>
                <span>{new Date(o.created_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-black/20 px-5 py-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                      <CreditCard className="h-3 w-3" /> Order Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Phone:</span> <a href={`tel:${o.phone}`} className="text-primary hover:underline">{o.phone}</a></p>
                      <p><span className="text-muted-foreground">Payment:</span> {o.payment_method ?? "Not specified"}</p>
                      {o.order_type === "delivery" && (
                        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                          <p className="flex items-start gap-2">
                            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>
                              <span className="font-bold text-primary">Deliver to:</span><br />
                              {o.delivery_address}
                            </span>
                          </p>
                          {Number(o.delivery_fee) > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">Delivery fee: {formatMaloti(Number(o.delivery_fee))}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {o.payment_status !== "paid" && (
                      <Button variant="gold" size="sm" className="rounded-full" onClick={(e) => { e.stopPropagation(); void setStatus(o.id, "paid"); }}>
                        Mark as Paid
                      </Button>
                    )}
                    {o.payment_status !== "failed" && (
                      <Button variant="goldOutline" size="sm" className="rounded-full" onClick={(e) => { e.stopPropagation(); void setStatus(o.id, "failed"); }}>
                        Mark as Failed
                      </Button>
                    )}
                    {(o.payment_status === "paid" || o.payment_status === "failed") && (
                      <Button variant="ghost" size="sm" className="rounded-full" onClick={(e) => { e.stopPropagation(); void setStatus(o.id, "awaiting_confirmation"); }}>
                        Undo
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                    <Package className="h-3 w-3" /> Items ({o.order_items.reduce((acc, i) => acc + i.quantity, 0)})
                  </h4>
                  <ul className="divide-y divide-border/50 rounded-xl border border-border/50 bg-card/40 overflow-hidden">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between px-3 py-2 text-sm">
                        <span>
                          <span className="font-bold text-primary">{i.quantity}×</span> {i.product_name}
                        </span>
                        <span className="text-muted-foreground">{formatMaloti(Number(i.unit_price) * i.quantity)}</span>
                      </li>
                    ))}
                    <li className="flex justify-between bg-primary/5 px-3 py-2 text-sm font-bold">
                      <span>Total</span>
                      <span>{formatMaloti(Number(o.total))}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

