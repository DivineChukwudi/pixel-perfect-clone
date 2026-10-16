import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { adminDb } from "@/lib/adminDb";
import { useConfirm } from "@/components/ConfirmProvider";
import { RefreshCw, Trash2, Calendar, Users, Package, Mail, Phone, ChevronDown, User } from "lucide-react";

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  event_date: string | null;
  guests: number;
  package: string;
  message: string;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "contacted", "confirmed", "closed"] as const;

const statusStyle: Record<string, string> = {
  new: "bg-primary/20 text-primary border-primary/50",
  contacted: "bg-[var(--gold-soft)]/20 text-foreground border-[var(--gold-soft)]/50",
  confirmed: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/50",
  closed: "bg-muted/20 text-muted-foreground border-border/50",
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-ZA", { dateStyle: "medium" }) : "—";

export function CateringTab() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<typeof STATUSES[number] | "all">("all");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-catering"],
    refetchInterval: 30000,
    queryFn: async (): Promise<Enquiry[]> => {
      const { data: rows, error: dbError } = await adminDb
        .from("catering_enquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);
      if (dbError) throw new Error(dbError.message);
      return (rows ?? []) as Enquiry[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error: dbError } = await adminDb.from("catering_enquiries").update({ status }).eq("id", id);
    if (dbError) {
      toast.error(dbError.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-catering"] });
  };

  const remove = async (e: React.MouseEvent, enquiry: Enquiry) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete this request?",
      description: `The catering request from "${enquiry.name}" will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete request",
      destructive: true,
    });
    if (!ok) return;
    const { error: dbError } = await adminDb.from("catering_enquiries").delete().eq("id", enquiry.id);
    if (dbError) toast.error(dbError.message);
    else await queryClient.invalidateQueries({ queryKey: ["admin-catering"] });
  };

  const filteredEnquiries = (data ?? []).filter(e => filter === "all" ? true : e.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "gold" : "goldOutline"}
            size="sm"
            className="rounded-full"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "gold" : "goldOutline"}
              size="sm"
              className="rounded-full capitalize"
              onClick={() => setFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <Button variant="goldOutline" size="sm" className="rounded-full" onClick={() => void refetch()}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-center py-8">Loading requests…</p>}
      {error && <p className="text-destructive text-center py-8">{(error as Error).message}</p>}
      {!isLoading && filteredEnquiries.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No catering requests found.</p>
      )}

      <Accordion type="single" collapsible className="flex flex-col gap-3">
        {filteredEnquiries.map((enquiry) => (
          <AccordionItem key={enquiry.id} value={enquiry.id} className="gold-frame overflow-hidden rounded-2xl border-none">
            <AccordionTrigger className="flex flex-col items-start gap-2 px-5 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl text-primary">{enquiry.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle[enquiry.status] ?? ""}`}>
                    {enquiry.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {new Date(enquiry.created_at).toLocaleDateString("en-ZA")}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" /> {enquiry.package}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {enquiry.guests} guests
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(enquiry.event_date)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border/50 bg-black/20 px-5 py-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                      <User className="h-3 w-3" /> Contact Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <a href={`tel:${enquiry.phone}`} className="text-primary hover:underline">{enquiry.phone}</a>
                      </p>
                      {enquiry.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <a href={`mailto:${enquiry.email}`} className="text-primary hover:underline">{enquiry.email}</a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                      Status Action
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <Button
                          key={status}
                          variant={enquiry.status === status ? "gold" : "goldOutline"}
                          size="sm"
                          className="rounded-full capitalize"
                          onClick={(e) => { e.stopPropagation(); void setStatus(enquiry.id, status); }}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
                      Message / Notes
                    </h4>
                    <div className="rounded-xl border border-border/50 bg-card/40 p-4 text-sm text-muted-foreground min-h-[100px]">
                      {enquiry.message || "No special message provided."}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-muted-foreground hover:text-destructive"
                      onClick={(e) => void remove(e, enquiry)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete Request
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

