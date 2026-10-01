import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminDb } from "@/lib/adminDb";
import { getSettingValue, siteSettingsQuery } from "@/lib/queries";

const upsert = (rows: { key: string; value: string }[]) =>
  adminDb
    .from("site_settings")
    .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: "key" });

export function DeliverySettings() {
  const queryClient = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [available, setAvailable] = useState(false);
  const [fee, setFee] = useState("0");
  const [minOrder, setMinOrder] = useState("0");
  const [areas, setAreas] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvailable(getSettingValue(data, "delivery_status", "unavailable") === "available");
    setFee(getSettingValue(data, "delivery_fee", "0"));
    setMinOrder(getSettingValue(data, "delivery_min_order", "0"));
    setAreas(getSettingValue(data, "delivery_areas", ""));
  }, [data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["site-settings"] });

  const toggle = async (next: boolean) => {
    const { error } = await upsert([{ key: "delivery_status", value: next ? "available" : "unavailable" }]);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAvailable(next);
    toast.success(next ? "Delivery is now AVAILABLE" : "Delivery is now temporarily unavailable");
    await refresh();
  };

  const save = async () => {
    const numeric = /^\d+(\.\d+)?$/;
    if (!numeric.test(fee.trim()) || !numeric.test(minOrder.trim())) {
      toast.error("Fee and minimum order must be numbers (use 0 for none).");
      return;
    }
    setSaving(true);
    const { error } = await upsert([
      { key: "delivery_fee", value: fee.trim() },
      { key: "delivery_min_order", value: minOrder.trim() },
      { key: "delivery_areas", value: areas.trim() },
    ]);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Delivery details saved");
      await refresh();
    }
  };

  return (
    <article className="gold-frame flex flex-col gap-5 rounded-2xl p-5">
      <h3 className="text-lg font-semibold">Delivery</h3>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
          available ? "border-[var(--success)]" : "border-destructive/60"
        }`}
      >
        <div>
          <p className={`font-semibold ${available ? "text-[var(--success)]" : "text-destructive"}`}>
            {available ? "Delivery is AVAILABLE" : "Delivery is TEMPORARILY UNAVAILABLE"}
          </p>
          <p className="text-xs text-muted-foreground">
            {available
              ? "Customers can choose delivery at checkout."
              : "Customers see delivery greyed out and can still order pickup or eat-in."}
          </p>
        </div>
        <Button variant={available ? "goldOutline" : "gold"} className="rounded-full" onClick={() => void toggle(!available)}>
          {available ? "Switch off" : "Switch on"}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Delivery fee (Maloti, 0 for free)</span>
          <Input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Minimum order for delivery (Maloti, 0 for none)</span>
          <Input inputMode="decimal" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted-foreground">Areas you deliver to (shown to customers)</span>
        <Textarea
          rows={2}
          value={areas}
          placeholder="e.g. Maseru CBD, Maseru West, Ha Thetsane"
          onChange={(e) => setAreas(e.target.value)}
        />
      </label>
      <Button variant="gold" className="w-fit rounded-full" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save delivery details"}
      </Button>
    </article>
  );
}
