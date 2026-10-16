import * as React from "react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, PartyPopper, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useI18n } from "@/i18n";
import { adminDb as looseDb } from "@/lib/adminDb";

export const Route = createFileRoute("/catering")({
  head: () => ({ meta: [{ title: "Catering — T&M Lunch" }] }),
  component: CateringPage,
});

const offerings = [
  { icon: Users, title: "catering.p1Title", text: "catering.p1Text" },
  { icon: PartyPopper, title: "catering.p2Title", text: "catering.p2Text" },
  { icon: ChefHat, title: "catering.p3Title", text: "catering.p3Text" },
] as const;

const packageOptions = [
  { value: "small", label: "catering.packageSmall" },
  { value: "wedding", label: "catering.packageWedding" },
  { value: "corporate", label: "catering.packageCorporate" },
  { value: "custom", label: "catering.packageCustom" },
] as const;

type PackageValue = (typeof packageOptions)[number]["value"];

function CateringPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [pkg, setPkg] = useState<PackageValue>("small");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError(t("catering.missingDetails"));
      return;
    }
    setSending(true);
    const { error: dbError } = await looseDb.from("catering_enquiries").insert({
      name: name.trim().slice(0, 80),
      phone: phone.trim().slice(0, 40),
      email: email.trim() ? email.trim().slice(0, 120) : null,
      event_date: eventDate || null,
      guests: guests ? Number(guests) : 0,
      package: pkg,
      message: message.trim().slice(0, 1000),
    });
    setSending(false);
    if (dbError) {
      setError(t("catering.error"));
      return;
    }
    setDone(true);
  };

  return (
    <div className="section-shell py-12">
      <div className="mb-10 text-center">
        <h1 className="gold-text-gradient text-4xl md:text-5xl">{t("catering.title")}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{t("catering.sub")}</p>
      </div>

      <section className="gold-frame mb-10 rounded-3xl p-8 text-center">
        <h2 className="text-2xl md:text-3xl">{t("catering.introTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("catering.introText")}</p>
      </section>

      <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {offerings.map(({ icon: Icon, title, text }) => (
          <div key={title} className="gold-frame flex flex-col items-center gap-3 rounded-3xl p-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--gold-soft)] text-primary">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="text-lg">{t(title)}</h3>
            <p className="text-sm text-muted-foreground">{t(text)}</p>
          </div>
        ))}
      </div>

      {done ? (
        <p className="gold-frame mx-auto max-w-xl rounded-3xl px-8 py-10 text-center font-display text-2xl">
          {t("catering.thanks")}
        </p>
      ) : (
        <section className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl md:text-3xl">{t("catering.formTitle")}</h2>
          <p className="mt-2 mb-6 text-center text-muted-foreground">{t("catering.formNote")}</p>
          <form onSubmit={submit} className="gold-frame flex flex-col gap-5 rounded-3xl p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.name")}
                <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.phone")}
                <Input type="tel" value={phone} maxLength={40} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.email")}
                <Input type="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.date")}
                <DatePicker
                  value={eventDate}
                  onChange={setEventDate}
                  placeholder={t("catering.date")}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.guests")}
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                {t("catering.package")}
                <Select value={pkg} onValueChange={(v) => setPkg(v as PackageValue)}>
                  <SelectTrigger className="bg-transparent">
                    <SelectValue placeholder={t("catering.package")} />
                  </SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              {t("catering.message")}
              <Textarea value={message} maxLength={1000} rows={4} onChange={(e) => setMessage(e.target.value)} />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" variant="gold" size="lg" disabled={sending}>
              {t("catering.submit")}
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
