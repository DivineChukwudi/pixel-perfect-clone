import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/feedback")({
  head: () => ({ meta: [{ title: "Feedback — T&M Lunch" }] }),
  component: FeedbackPage,
});

function FeedbackPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 1) {
      setError(t("feedback.nameRequired"));
      return;
    }
    setSending(true);
    const { error: dbError } = await supabase
      .from("feedback")
      .insert({ name: name.trim().slice(0, 80), rating, message: message.trim().slice(0, 1000) });
    setSending(false);
    if (dbError) {
      setError(t("feedback.error"));
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="section-shell flex min-h-[50vh] items-center justify-center py-16">
        <p className="gold-frame rounded-3xl px-8 py-10 text-center font-display text-2xl">
          {t("feedback.thanks")}
        </p>
      </div>
    );
  }

  return (
    <div className="section-shell max-w-xl py-12">
      <h1 className="gold-text-gradient text-4xl">{t("feedback.title")}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{t("feedback.sub")}</p>
      <form onSubmit={submit} className="gold-frame flex flex-col gap-5 rounded-3xl p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          {t("feedback.name")}
          <Input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          {t("feedback.rating")}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n}`}
                onClick={() => setRating(n)}
                className="cursor-pointer p-1"
              >
                <Star
                  className={`h-7 w-7 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          {t("feedback.message")}
          <Textarea
            value={message}
            maxLength={1000}
            rows={5}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="gold" size="lg" disabled={sending}>
          {t("feedback.submit")}
        </Button>
      </form>
    </div>
  );
}
