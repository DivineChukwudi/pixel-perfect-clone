import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "./ImageField";
import { adminDb } from "@/lib/adminDb";
import { Plus, Trash2 } from "lucide-react";

type Promo = {
  id: string;
  title_en: string;
  title_so: string;
  description_en: string;
  description_so: string;
  image_url: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const toDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function PromotionsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async (): Promise<Promo[]> => {
      const { data: rows, error: dbError } = await adminDb
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (dbError) throw new Error(dbError.message);
      return (rows ?? []) as Promo[];
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }),
      queryClient.invalidateQueries({ queryKey: ["promotions"] }),
    ]);
  };

  const add = async () => {
    const { error: dbError } = await adminDb
      .from("promotions")
      .insert({ title_en: "New promotion", title_so: "New promotion", active: false });
    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Added as inactive. Fill it in, then switch Active on.");
      await refresh();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Only active promotions inside their date range show on the website.
        </p>
        <Button variant="gold" size="sm" className="rounded-full" onClick={() => void add()}>
          <Plus /> Add promotion
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {(data ?? []).map((p) => (
        <PromoEditor key={p.id} promo={p} onChanged={refresh} />
      ))}
    </div>
  );
}

function PromoEditor({ promo, onChanged }: { promo: Promo; onChanged: () => Promise<void> }) {
  const [draft, setDraft] = useState(promo);
  const [start, setStart] = useState(toDateInput(promo.starts_at));
  const [end, setEnd] = useState(toDateInput(promo.ends_at));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(promo);
    setStart(toDateInput(promo.starts_at));
    setEnd(toDateInput(promo.ends_at));
  }, [promo]);

  const toggleActive = async (active: boolean) => {
    const { error: dbError } = await adminDb.from("promotions").update({ active }).eq("id", promo.id);
    if (dbError) {
      toast.error(dbError.message);
      return;
    }
    setDraft((d) => ({ ...d, active }));
    await onChanged();
  };

  const save = async () => {
    if (!draft.title_en.trim() || !draft.title_so.trim()) {
      toast.error("Both titles are required.");
      return;
    }
    if (start && end && start > end) {
      toast.error("The end date is before the start date.");
      return;
    }
    setSaving(true);
    const { error: dbError } = await adminDb
      .from("promotions")
      .update({
        title_en: draft.title_en.trim(),
        title_so: draft.title_so.trim(),
        description_en: draft.description_en,
        description_so: draft.description_so,
        image_url: draft.image_url?.trim() ? draft.image_url.trim() : null,
        starts_at: start ? new Date(`${start}T00:00:00`).toISOString() : null,
        ends_at: end ? new Date(`${end}T23:59:59`).toISOString() : null,
      })
      .eq("id", promo.id);
    setSaving(false);
    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Saved");
      await onChanged();
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${promo.title_en}"?`)) return;
    const { error: dbError } = await adminDb.from("promotions").delete().eq("id", promo.id);
    if (dbError) toast.error(dbError.message);
    else await onChanged();
  };

  return (
    <article className="gold-frame flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Switch checked={draft.active} onCheckedChange={(v) => void toggleActive(v)} />
          Active
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void remove()}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <Trash2 /> Delete
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title (English)">
          <Input value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
        </Field>
        <Field label="Title (Sesotho)">
          <Input value={draft.title_so} onChange={(e) => setDraft({ ...draft, title_so: e.target.value })} />
        </Field>
        <Field label="Details (English)">
          <Textarea rows={3} value={draft.description_en} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} />
        </Field>
        <Field label="Details (Sesotho)">
          <Textarea rows={3} value={draft.description_so} onChange={(e) => setDraft({ ...draft, description_so: e.target.value })} />
        </Field>
        <Field label="Starts (optional)">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Ends (optional)">
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <ImageField value={draft.image_url} folder="promotions" onChange={(url) => setDraft({ ...draft, image_url: url })} />
      <Button variant="gold" className="w-fit rounded-full" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
