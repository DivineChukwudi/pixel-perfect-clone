/**
 * Single source of truth for T&M Lunch business details.
 * Anything not confirmed yet is a clearly marked placeholder.
 * Replace a placeholder with a real value and the matching section
 * switches on automatically (map, video, socials, delivery).
 */

export const PLACEHOLDER_MARK = "XXXX";

export const siteConfig = {
  businessName: "T&M Lunch",
  sloganEn: "Good Food • Great Mood",
  sloganSo: "Lijo Tse Monate • Maikutlo a Matle",

  // Contact — placeholders until confirmed
  phone: "+266 XXXX XXXX",
  whatsapp: "+266 XXXX XXXX",
  email: "hello@XXXX.co.ls",
  facebookUrl: "",

  address: "Address coming soon",
  openingHours: [
    { dayEn: "Monday – Friday", daySo: "Mantaha – Labohlano", hours: "08:00 – 18:00" },
    { dayEn: "Saturday", daySo: "Moqebelo", hours: "09:00 – 16:00" },
    { dayEn: "Sunday", daySo: "Sontaha", hours: "Closed" },
  ],

  // Embeds — empty string means "Coming soon"
  mapEmbedUrl: "",
  videoUrl: "",

  // Mobile money merchant numbers — placeholders
  payments: {
    mpesaMerchantNumber: "XXXXXX",
    ecocashMerchantNumber: "XXXXXX",
  },

  deliveryEnabled: false,

  loyalty: {
    enabled: true,
    buyQuantity: 3,
    freeQuantity: 1,
  },

  currency: { code: "LSL", symbol: "M" },
} as const;

export const isPlaceholder = (value: string | undefined | null) =>
  !value || value.trim() === "" || value.includes(PLACEHOLDER_MARK) || value.includes("coming soon");

export const hasMap = () => !isPlaceholder(siteConfig.mapEmbedUrl);
export const hasVideo = () => !isPlaceholder(siteConfig.videoUrl);
export const hasFacebook = () => !isPlaceholder(siteConfig.facebookUrl);
export const hasPhone = () => !isPlaceholder(siteConfig.phone);
export const hasWhatsapp = () => !isPlaceholder(siteConfig.whatsapp);
export const hasEmail = () => !isPlaceholder(siteConfig.email);
export const hasAddress = () => !isPlaceholder(siteConfig.address);

export const whatsappLink = (message: string) =>
  `https://wa.me/${siteConfig.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;

export const formatMaloti = (amount: number) =>
  `${siteConfig.currency.symbol}${Number(amount || 0).toFixed(2)}`;
