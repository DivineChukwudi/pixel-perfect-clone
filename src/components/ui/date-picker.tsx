import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  /** ISO date string in `yyyy-MM-dd` form, or empty string when unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Earliest selectable day. Defaults to today; pass `null` to allow any date. */
  minDate?: Date | null;
};

const parseValue = (value: string) => {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  disabled,
  className,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseValue(value);
  const floor =
    minDate === undefined ? new Date(new Date().setHours(0, 0, 0, 0)) : minDate ?? undefined;

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "group flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              !selected && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {selected ? format(selected, "EEE, d MMM yyyy") : placeholder}
            </span>
            <CalendarIcon className="h-4 w-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-auto overflow-hidden rounded-2xl border-[var(--gold-soft)] bg-popover/95 p-0 shadow-[0_24px_60px_-20px_var(--gold-glow)] backdrop-blur-xl"
        >
          <Calendar
            mode="single"
            selected={selected}
            {...(selected ? { defaultMonth: selected } : {})}
            captionLayout="dropdown"
            {...(floor ? { disabled: { before: floor } } : {})}
            className="bg-transparent p-3"
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange(format(new Date(), "yyyy-MM-dd"));
                setOpen(false);
              }}
              className="rounded-full px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {selected && !disabled && (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => onChange("")}
          className="absolute right-8 top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded-full text-muted-foreground opacity-60 transition hover:text-destructive hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
