export type VideoSource = { kind: "iframe" | "video"; src: string };

export function toVideoSource(url: string): VideoSource {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  if (/facebook\.com|fb\.watch/.test(url)) {
    return {
      kind: "iframe",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
    };
  }
  return { kind: "video", src: url };
}
