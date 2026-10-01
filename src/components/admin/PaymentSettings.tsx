import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDb } from "@/lib/adminDb";
import { getSettingValue, siteSettingsQuery } from "@/lib/queries";

export function PaymentSettings() {
  const queryClient = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [mpesa, setMpesa] = useState("");
  const [ecocash, setEcocash] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMpesa(getSettingValue(data, "mpesa_merchant_number", ""));
    setEcocash(getSettingValue(data, "ecocash_merchant_number", ""));
  }, [data]);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await adminDb.from("site_settings").upsert(
      [
        { key: "mpesa_merchant_number", value: mpesa.trim(), updated_at: now },
        { key: "ecocash_merchant_number", value: ecocash.trim(), updated_at: now },
      ],
      { onConflict: "key" },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Payment numbers saved");
      await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    }
  };

  return (
    <article className="gold-frame flex flex-col gap-4 rounded-2xl p-5">
      <h3 className="text-lg font-semibold">Payment numbers</h3>
      <p className="text-sm text-muted-foreground">
        Customers are told to send their payment to these numbers and quote their order number as the reference. Use the
        shop's real M-Pesa and EcoCash merchant (or till) numbers. Leave blank until confirmed.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">M-Pesa merchant number</span>
          <Input inputMode="tel" value={mpesa} onChange={(e) => setMpesa(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">EcoCash merchant number</span>
          <Input inputMode="tel" value={ecocash} onChange={(e) => setEcocash(e.target.value)} />
        </label>
      </div>
      <Button variant="gold" className="w-fit rounded-full" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save payment numbers"}
      </Button>
    </article>
  );
}
