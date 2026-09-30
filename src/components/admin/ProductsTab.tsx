import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "./ImageField";
import { adminDb } from "@/lib/adminDb";
import { CATEGORIES } from "@/lib/products";

type Product = {
  id: string;
  name_en: string;
  name_so: string;
  description_en: string;
  description_so: string;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  featured: boolean;
  is_special: boolean;
  sort_order: number;
};

export function ProductsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data: rows, error: dbError } = await adminDb.from("products").select("*").order("sort_order");
      if (dbError) throw new Error(dbError.message);
      return (rows ?? []) as Product[];
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
  };

  const add = async () => {
    const next = Math.max(0, ...(data ?? []).map((p) => p.sort_order)) + 1;
    const { error: dbError } = await adminDb.from("products").insert({
      name_en: "New item",
      name_so: "New item",
      price: 0,
      category: "other",
      available: false,
      sort_order: next,
    });
    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Added as hidden (sold out). Fill it in, then switch Available on.");
      await refresh();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Available, Featured and Today's Special save instantly. Other edits need Save.
        </p>
        <Button variant="gold" size="sm" className="rounded-full" onClick={() => void add()}>
          + Add item
        </Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {(data ?? []).map((p) => (
        <ProductEditor key={p.id} product={p} others={data ?? []} onChanged={refresh} />
      ))}
    </div>
  );
}

function ProductEditor({
  product,
  others,
  onChanged,
}: {
  product: Product;
  others: Product[];
  onChanged: () => Promise<void>;
}) {
  const [draft, setDraft] = useState(product);
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(product);
    setPrice(String(product.price));
  }, [product]);

  const quick = async (patch: Partial<Product>, clearOthersSpecial = false) => {
    if (clearOthersSpecial) {
      const { error: e1 } = await adminDb.from("products").update({ is_special: false }).neq("id", product.id);
      if (e1) {
        toast.error(e1.message);
        return;
      }
    }
    const { error: dbError } = await adminDb.from("products").update(patch).eq("id", product.id);
    if (dbError) {
      toast.error(dbError.message);
      return;
    }
    setDraft((d) => ({ ...d, ...patch }));
    await onChanged();
  };

  const save = async () => {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Price must be a number, 0 or more.");
      return;
    }
    if (!draft.name_en.trim() || !draft.name_so.trim()) {
      toast.error("Both names are required.");
      return;
    }
    setSaving(true);
    const { error: dbError } = await adminDb
      .from("products")
      .update({
        name_en: draft.name_en.trim(),
        name_so: draft.name_so.trim(),
        description_en: draft.description_en,
        description_so: draft.description_so,
        price: value,
        category: draft.category,
        image_url: draft.image_url?.trim() ? draft.image_url.trim() : null,
      })
      .eq("id", product.id);
    setSaving(false);
    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Saved");
      await onChanged();
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${product.name_en}"? Past orders keep their item names.`)) return;
    const { error: dbError } = await adminDb.from("products").delete().eq("id", product.id);
    if (dbError) toast.error(dbError.message);
    else await onChanged();
  };

  const categories = Array.from(new Set<string>([...CATEGORIES, "other", draft.category]));
  const hasOtherSpecial = others.some((o) => o.is_special && o.id !== product.id);

  return (
    <article className="gold-frame flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Toggle label="Available" checked={draft.available} onChange={(v) => void quick({ available: v })} />
        <Toggle label="Featured" checked={draft.featured} onChange={(v) => void quick({ featured: v })} />
        <Toggle
          label="Today's Special"
          checked={draft.is_special}
          onChange={(v) => void quick({ is_special: v }, v && hasOtherSpecial)}
        />
        <button
          type="button"
          onClick={() => void remove()}
          className="ml-auto cursor-pointer text-xs text-muted-foreground hover:text-destructive"
        >
          Delete
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name (English)">
          <Input value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} />
        </Field>
        <Field label="Name (Sesotho)">
          <Input value={draft.name_so} onChange={(e) => setDraft({ ...draft, name_so: e.target.value })} />
        </Field>
        <Field label="Description (English)">
          <Textarea rows={2} value={draft.description_en} onChange={(e) => setDraft({ ...draft, description_en: e.target.value })} />
        </Field>
        <Field label="Description (Sesotho)">
          <Textarea rows={2} value={draft.description_so} onChange={(e) => setDraft({ ...draft, description_so: e.target.value })} />
        </Field>
        <Field label="Price (Maloti)">
          <Input value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Category">
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ImageField value={draft.image_url} folder="products" onChange={(url) => setDraft({ ...draft, image_url: url })} />

      <Button variant="gold" className="w-fit rounded-full" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </article>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
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
