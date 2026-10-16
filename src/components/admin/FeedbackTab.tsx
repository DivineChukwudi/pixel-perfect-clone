import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { adminDb } from "@/lib/adminDb";
import { ChevronDown, RefreshCw, SortAsc, SortDesc, Star } from "lucide-react";

type Entry = { id: string; name: string; rating: number; message: string; created_at: string };

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "5", label: "5 star" },
  { key: "4", label: "4 star" },
  { key: "3", label: "3 star" },
  { key: "low", label: "2 star & below" },
] as const;

type SortKey = "date" | "rating";
type SortOrder = "asc" | "desc";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
        />
      ))}
    </span>
  );
}

export function FeedbackTab() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-feedback"],
    refetchInterval: 30000,
    queryFn: async (): Promise<Entry[]> => {
      const { data: rows, error: dbError } = await adminDb
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (dbError) throw new Error(dbError.message);
      return (rows ?? []) as Entry[];
    },
  });

  const entries = (data ?? []).filter((f) =>
    category === "all"
      ? true
      : category === "low"
        ? f.rating <= 2
        : f.rating === Number(category),
  );

  const sorted = [...entries].sort((a, b) => {
    if (sortKey === "rating") {
      return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
    }
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
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
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              type="button"
              variant={category === c.key ? "gold" : "goldOutline"}
              size="sm"
              className="rounded-full"
              onClick={() => setCategory(c.key)}
            >
              {c.label}
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
            onClick={() => toggleSort("rating")}
            className={`rounded-full ${sortKey === "rating" ? "text-primary" : "text-muted-foreground"}`}
          >
            Rating {sortKey === "rating" && (sortOrder === "desc" ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />)}
          </Button>
          <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Feedback refreshes automatically every 30 seconds.</p>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {!isLoading && sorted.length === 0 && <p className="text-muted-foreground">No feedback in this category yet.</p>}

      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {sorted.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="gold-frame overflow-hidden rounded-2xl border-none">
            <AccordionTrigger className="flex flex-col items-start gap-2 px-5 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex w-full items-center justify-between gap-3">
                <span className="font-display text-lg text-primary">{f.name}</span>
                <div className="flex items-center gap-4">
                  <Stars rating={f.rating} />
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(f.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-black/20 px-5 py-4">
              <div className="rounded-xl border border-border/50 bg-card/40 p-4 text-sm text-muted-foreground">
                {f.message || "No written comment provided."}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
