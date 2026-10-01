import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LogOut,
  MessageSquareText,
  PackageCheck,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { PromotionsTab } from "@/components/admin/PromotionsTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { supabase } from "@/integrations/supabase/client";
import { adminDb } from "@/lib/adminDb";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Management Portal — T&M Lunch" },
      { name: "description", content: "Secure management portal for T&M Lunch orders, menu, promotions and settings." },
      { property: "og:title", content: "Management Portal — T&M Lunch" },
      { property: "og:description", content: "Secure management portal for T&M Lunch operations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Status = "loading" | "signedOut" | "notAdmin" | "ready";

function AdminPage() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;

    const evaluate = async (userId: string | undefined) => {
      if (!userId) {
        if (active) setStatus("signedOut");
        return;
      }
      const { data } = await adminDb
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (active) setStatus(data ? "ready" : "notAdmin");
    };

    void supabase.auth.getSession().then(({ data }) => evaluate(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer: awaiting Supabase calls inside this callback can deadlock.
      setTimeout(() => void evaluate(session?.user.id), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "loading") {
    return <p className="section-shell py-24 text-center text-muted-foreground">Checking access…</p>;
  }
  if (status === "signedOut") return <Login />;
  if (status === "notAdmin") {
    return (
      <div className="section-shell flex flex-col items-center gap-4 py-24 text-center">
        <p>This account is not an admin account.</p>
        <Button variant="goldOutline" onClick={() => void supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur-xl">
        <div className="section-shell flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <Logo compact />
            <div className="hidden border-l border-border pl-4 sm:block">
              <h1 className="font-display text-xl text-primary">Management Portal</h1>
              <p className="text-xs text-muted-foreground">T&amp;M Lunch operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void supabase.auth.signOut()}>
              <LogOut /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="section-shell py-8 md:py-10">
        <div className="mb-7">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
            <ShieldCheck className="h-4 w-4" /> Secure workspace
          </p>
          <h2 className="text-3xl text-foreground md:text-4xl">Run your restaurant</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review new orders, keep your menu current, and control what customers see.
          </p>
        </div>

        <Tabs defaultValue="orders" orientation="vertical" className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <TabsList className="flex h-auto flex-row justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-card p-2 lg:sticky lg:top-5 lg:flex-col lg:self-start lg:overflow-visible">
            <AdminTab value="orders" icon={ShoppingBag} label="Orders" />
            <AdminTab value="products" icon={UtensilsCrossed} label="Menu & prices" />
            <AdminTab value="promotions" icon={Tags} label="Promotions" />
            <AdminTab value="feedback" icon={MessageSquareText} label="Feedback" />
            <AdminTab value="settings" icon={Settings} label="Settings" />
          </TabsList>
          <div className="min-w-0">
            <TabsContent value="orders" className="mt-0"><OrdersTab /></TabsContent>
            <TabsContent value="products" className="mt-0"><ProductsTab /></TabsContent>
            <TabsContent value="promotions" className="mt-0"><PromotionsTab /></TabsContent>
            <TabsContent value="feedback" className="mt-0"><FeedbackTab /></TabsContent>
            <TabsContent value="settings" className="mt-0"><SettingsTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function AdminTab({ value, icon: Icon, label }: { value: string; icon: typeof ShoppingBag; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="h-11 shrink-0 justify-start gap-3 px-3 text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground lg:w-full"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </TabsTrigger>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) setError(authError.message);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div>
            <Logo compact />
            <p className="mt-2 text-xs font-semibold uppercase text-muted-foreground">Management portal</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(16rem,1fr)]">
          <section className="flex min-h-[28rem] flex-col justify-between rounded-lg border-l-4 border-primary bg-card p-6 shadow-card md:p-10">
            <div>
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h1 className="text-4xl text-foreground md:text-5xl">Welcome back</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                Sign in to manage orders, menu items, promotions, customer feedback and shop settings.
              </p>
            </div>

            <form onSubmit={submit} className="mt-10 max-w-md space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Email address
                <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Password
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-10 text-muted-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </label>
              {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="gold" size="lg" className="w-full rounded-md" disabled={busy}>
                {busy ? "Signing in…" : "Enter management portal"}
              </Button>
            </form>
          </section>

          <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <PortalFeature icon={PackageCheck} title="Orders" detail="Review and confirm incoming orders" />
            <PortalFeature icon={UtensilsCrossed} title="Menu & prices" detail="Update items, prices and availability" />
            <PortalFeature icon={Sparkles} title="Promotions" detail="Control offers customers can see" />
            <PortalFeature icon={Settings} title="Shop settings" detail="Manage delivery and payment details" />
          </aside>
        </div>

        <Button asChild variant="ghost" className="mx-auto mt-7 flex w-fit rounded-full text-muted-foreground hover:text-primary">
          <Link to="/"><ArrowLeft /> Return to the customer website</Link>
        </Button>
      </div>
    </div>
  );
}

function PortalFeature({ icon: Icon, title, detail }: { icon: typeof ShoppingBag; title: string; detail: string }) {
  return (
    <div className="group flex min-h-24 items-center gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg text-foreground">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
