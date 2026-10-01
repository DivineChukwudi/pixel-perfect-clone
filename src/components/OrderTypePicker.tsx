import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import type { DeliveryInfo } from "@/lib/delivery";
import type { OrderType } from "@/lib/orders";
import { formatMaloti } from "@/config/siteConfig";

type Props = {
  value: OrderType;
  onChange: (value: OrderType) => void;
  address: string;
  onAddressChange: (value: string) => void;
  delivery: DeliveryInfo;
};

export function OrderTypePicker({ value, onChange, address, onAddressChange, delivery }: Props) {
  const { t } = useI18n();
  const options: { type: OrderType; label: string; disabled: boolean }[] = [
    { type: "takeaway", label: t("buy.takeaway"), disabled: false },
    { type: "eat_in", label: t("buy.eatin"), disabled: false },
    { type: "delivery", label: t("buy.delivery"), disabled: !delivery.available },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t("buy.orderType")}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ type, label, disabled }) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(type)}
            className={`rounded-full border px-2 py-2 text-sm transition-colors ${
              disabled
                ? "cursor-not-allowed border-border text-muted-foreground/50 line-through"
                : value === type
                  ? "cursor-pointer border-primary bg-primary text-primary-foreground"
                  : "cursor-pointer border-[var(--gold-soft)] text-muted-foreground hover:text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {delivery.loaded && !delivery.available && (
        <p className="text-xs text-muted-foreground">{t("buy.deliveryUnavailable")}</p>
      )}

      {value === "delivery" && delivery.available && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5 text-sm">
            {t("buy.deliveryAddress")}
            <Textarea
              rows={3}
              maxLength={300}
              value={address}
              placeholder={t("buy.deliveryAddressHint")}
              onChange={(e) => onAddressChange(e.target.value)}
            />
          </label>
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {delivery.areas && (
              <span>
                {t("buy.deliveryAreas")}: {delivery.areas}
              </span>
            )}
            {delivery.fee > 0 && (
              <span>
                {t("buy.deliveryFee")}: {formatMaloti(delivery.fee)}
              </span>
            )}
            {delivery.minOrder > 0 && (
              <span>
                {t("buy.deliveryMin")}: {formatMaloti(delivery.minOrder)}
              </span>
            )}
            <span>{t("checkout.deliveryNote")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
