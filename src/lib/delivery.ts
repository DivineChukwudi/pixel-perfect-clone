import { useQuery } from "@tanstack/react-query";
import { getSettingValue, siteSettingsQuery, type SiteSettingRow } from "@/lib/queries";

export type DeliveryInfo = {
  loaded: boolean;
  /** Shop has delivery switched on right now. */
  available: boolean;
  fee: number;
  minOrder: number;
  areas: string;
};

const toNumber = (value: string) => (/^\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : 0);

export function readDelivery(settings: SiteSettingRow[] | undefined): DeliveryInfo {
  return {
    loaded: settings !== undefined,
    available: getSettingValue(settings, "delivery_status", "unavailable") === "available",
    fee: toNumber(getSettingValue(settings, "delivery_fee", "0")),
    minOrder: toNumber(getSettingValue(settings, "delivery_min_order", "0")),
    areas: getSettingValue(settings, "delivery_areas", "").trim(),
  };
}

export function useDelivery(): DeliveryInfo {
  const { data } = useQuery(siteSettingsQuery);
  return readDelivery(data);
}
