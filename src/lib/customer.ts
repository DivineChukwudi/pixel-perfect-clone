import type { OrderType } from "@/lib/orders";

const KEY = "tm-lunch-customer";

export type CustomerDetails = { name: string; phone: string; orderType: OrderType; address: string };

export function loadCustomer(): CustomerDetails {
  const fallback: CustomerDetails = { name: "", phone: "", orderType: "takeaway", address: "" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<CustomerDetails>) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveCustomer(details: CustomerDetails) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable, ignore */
  }
}
