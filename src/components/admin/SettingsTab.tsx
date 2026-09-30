import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminDb } from "@/lib/adminDb";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, getSettingValue } from "@/lib/queries";
import { toVideoSource } from "@/lib/video";
import { isPlaceholder } from "@/config/siteConfig";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export function SettingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(siteSettingsQuery);

  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setVideoUrl(getSettingValue(data, "video_url", ""));
  }, [data]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["site-settings"] });
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file (MP4, WebM, etc.).");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("That video is over 100 MB. Compress it or use a shorter clip.");
      return;
    }
    setUploading(true);
    const ext = (file.name.split(".").pop() ?? "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const path = `promo/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("site-videos")
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setUploading(false);
    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }
    const publicUrl = supabase.storage.from("site-videos").getPublicUrl(path).data.publicUrl;
    setVideoUrl(publicUrl);
    toast.success("Video uploaded. Press Save to keep it.");
  };

  const save = async () => {
    setSaving(true);
    const value = videoUrl.trim();
    const { error: dbError } = await adminDb
      .from("site_settings")
      .upsert({ key: "video_url", value, updated_at: new Date().toISOString() });
    setSaving(false);
    if (dbError) {
      toast.error(dbError.message);
    } else {
      toast.success("Promotional video saved");
      await refresh();
    }
  };

  const clear = async () => {
    if (!window.confirm("Remove the promotional video? It will show 'Coming soon' on the website.")) return;
    setSaving(true);
    const { error: dbError } = await adminDb
      .from("site_settings")
      .upsert({ key: "video_url", value: "", updated_at: new Date().toISOString() });
    setSaving(false);
    if (dbError) {
      toast.error(dbError.message);
    } else {
      setVideoUrl("");
      toast.success("Promotional video removed");
      await refresh();
    }
  };

  const hasVideo = !isPlaceholder(videoUrl);
  const source = hasVideo ? toVideoSource(videoUrl) : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Upload a video file from your device, or paste a YouTube / Facebook / direct video link.
      </p>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}

      <article className="gold-frame flex flex-col gap-5 rounded-2xl p-5">
        <h3 className="text-lg font-semibold">Promotional Video</h3>

        {/* Upload from device */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-full border border-[var(--gold-soft)] px-4 py-2 text-sm text-primary hover:bg-primary/10">
            {uploading ? "Uploading…" : "Upload from device"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              disabled={uploading || saving}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
          <span className="text-xs text-muted-foreground">Max 100 MB · MP4 / WebM recommended</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or paste a link</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* URL input */}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Video URL</span>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=...  or  https://.../video.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </label>

        {/* Live preview */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Preview</p>
          {source ? (
            source.kind === "iframe" ? (
              <iframe
                src={source.src}
                title="Video preview"
                allowFullScreen
                className="gold-frame aspect-video w-full rounded-2xl"
              />
            ) : (
              <video
                src={source.src}
                controls
                muted
                playsInline
                className="gold-frame aspect-video w-full rounded-2xl bg-black"
              />
            )
          ) : (
            <div className="gold-frame grid aspect-video w-full place-items-center rounded-2xl text-muted-foreground">
              No video set — the homepage will show "Coming soon" here.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="gold" className="rounded-full" disabled={saving || uploading} onClick={() => void save()}>
            {saving ? "Saving…" : "Save video"}
          </Button>
          {hasVideo && (
            <Button
              variant="goldOutline"
              className="rounded-full"
              disabled={saving || uploading}
              onClick={() => void clear()}
            >
              Remove video
            </Button>
          )}
        </div>
      </article>
    </div>
  );
}
