import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — T&M Lunch" }, { name: "robots", content: "noindex" }] }),
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
    <div className="section-shell py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="gold-text-gradient text-3xl md:text-4xl">Admin</h1>
        <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void supabase.auth.signOut()}>
          Sign out
        </Button>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Menu &amp; prices</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (authError) setError(authError.message);
  };

  return (
    <div className="section-shell flex max-w-md flex-col gap-6 py-20">
      <h1 className="gold-text-gradient text-center text-4xl">Admin</h1>
      <form onSubmit={submit} className="gold-frame flex flex-col gap-4 rounded-3xl p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Password
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="gold" size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
