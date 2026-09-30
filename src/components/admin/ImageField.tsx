import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export function ImageField({
  value,
  onChange,
  folder,
}: {
  value: string | null;
  onChange: (url: string) => void;
  folder: string;
}) {
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("That image is over 3 MB. Compress it first (phones make huge files).");
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("site-images")
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setBusy(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    onChange(supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl);
    toast.success("Image uploaded. Press Save to keep it.");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-[var(--gold-soft)] text-xs text-muted-foreground">
            none
          </div>
        )}
        <label className="cursor-pointer rounded-full border border-[var(--gold-soft)] px-4 py-2 text-sm text-primary hover:bg-primary/10">
          {busy ? "Uploading…" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="cursor-pointer text-xs text-muted-foreground hover:text-destructive"
          >
            Use default photo
          </button>
        )}
      </div>
      <Input
        value={value ?? ""}
        placeholder="…or paste an image link"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
