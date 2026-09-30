import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, HeartHandshake, ShieldCheck, Smile } from "lucide-react";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Us — T&M Lunch" }] }),
  component: AboutPage,
});

const values = [
  { icon: ChefHat, title: "home.value1", text: "home.value1Text" },
  { icon: Smile, title: "home.value2", text: "home.value2Text" },
  { icon: ShieldCheck, title: "home.value3", text: "home.value3Text" },
  { icon: HeartHandshake, title: "home.value4", text: "home.value4Text" },
] as const;

function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="section-shell py-12">
      <h1 className="gold-text-gradient mb-10 text-center text-4xl md:text-5xl">{t("about.title")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="gold-frame rounded-3xl p-8">
          <h2 className="mb-3 text-2xl">{t("about.storyTitle")}</h2>
          <p className="text-muted-foreground">{t("about.story")}</p>
        </section>
        <section className="gold-frame rounded-3xl p-8">
          <h2 className="mb-3 text-2xl">{t("about.missionTitle")}</h2>
          <p className="text-muted-foreground">{t("about.mission")}</p>
        </section>
      </div>

      <h2 className="mt-12 mb-6 text-center text-3xl">{t("about.valuesTitle")}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="gold-frame flex flex-col items-center gap-3 rounded-3xl p-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--gold-soft)] text-primary">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="text-lg">{t(title)}</h3>
            <p className="text-sm text-muted-foreground">{t(text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
