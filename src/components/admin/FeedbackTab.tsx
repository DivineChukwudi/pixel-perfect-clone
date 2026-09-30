import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { adminDb } from "@/lib/adminDb";

type Entry = { id: string; name: string; rating: number; message: string; created_at: string };

export function FeedbackTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-feedback"],
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

  return (
    <div className="flex flex-col gap-4">
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && data.length === 0 && <p className="text-muted-foreground">No feedback yet.</p>}
      {(data ?? []).map((f) => (
        <article key={f.id} className="gold-frame flex flex-col gap-2 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{f.name}</span>
            <span className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-4 w-4 ${n <= f.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              ))}
            </span>
          </div>
          {f.message && <p className="text-sm text-muted-foreground">{f.message}</p>}
          <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString("en-ZA")}</p>
        </article>
      ))}
    </div>
  );
}
