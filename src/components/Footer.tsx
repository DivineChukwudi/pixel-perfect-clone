import { Link } from "@tanstack/react-router";
import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { ComingSoon } from "./ComingSoon";
import { useI18n } from "@/i18n";
import {
  hasEmail,
  hasFacebook,
  hasMap,
  hasPhone,
  siteConfig,
} from "@/config/siteConfig";

export function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer className="mt-20 border-t border-border bg-[oklch(0.96_0.01_80)] dark:bg-[var(--charcoal)]/60">
      <div className="section-shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground">
            {lang === "so" ? siteConfig.sloganSo : siteConfig.sloganEn}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm tracking-[0.18em] text-primary uppercase">
            {t("footer.quickLinks")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-primary">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/menu" className="hover:text-primary">
                {t("nav.menu")}
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="hover:text-primary">
                {t("nav.feedback")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm tracking-[0.18em] text-primary uppercase">
            {t("footer.contact")}
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Facebook className="h-4 w-4 shrink-0 text-primary" />
              {hasFacebook() ? (
                <a
                  href={siteConfig.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                >
                  {t("footer.facebook")}
                </a>
              ) : (
                <span>
                  {t("footer.facebook")} — {t("common.comingSoon")}
                </span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              {hasEmail() ? (
                <a href={`mailto:${siteConfig.email}`} className="hover:text-primary">
                  {siteConfig.email}
                </a>
              ) : (
                <span>{siteConfig.email}</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              {hasPhone() ? (
                <a href={`tel:${siteConfig.phone}`} className="hover:text-primary">
                  {siteConfig.phone}
                </a>
              ) : (
                <span>{siteConfig.phone}</span>
              )}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{siteConfig.address}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm tracking-[0.18em] text-primary uppercase">
            {t("footer.hours")}
          </h4>
          <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
            {siteConfig.openingHours.map((row) => (
              <li key={row.dayEn} className="flex justify-between gap-3">
                <span>{lang === "so" ? row.daySo : row.dayEn}</span>
                <span className="text-foreground">{row.hours}</span>
              </li>
            ))}
          </ul>
          <h4 className="mb-2 text-sm tracking-[0.18em] text-primary uppercase">
            {t("footer.findUs")}
          </h4>
          {hasMap() ? (
            <iframe
              title={t("footer.findUs")}
              src={siteConfig.mapEmbedUrl}
              className="h-40 w-full rounded-xl border border-[var(--gold-soft)]"
              loading="lazy"
            />
          ) : (
            <ComingSoon className="!py-6" />
          )}
        </div>
      </div>

      <div className="border-t border-border py-5">
        <p className="section-shell text-center text-xs text-muted-foreground">
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
