import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "missing";

interface HeroVideoProps {
  src: string;
  poster?: string;
  label: string;
  /** CSS aspect ratio of the render. video-engine compositions are 1080x1920 (9 / 16). */
  aspect?: string;
}

/**
 * Player frame for the video-engine render.
 *
 * Integration path: render the composition with Remotion
 * (`pnpm --filter @bxy/video-engine render <composition-id> out/anti-shopify-manifesto.mp4`)
 * and copy the file to `apps/bxy-web/public/video/`. A native <video> keeps the hero light;
 * swapping to `@remotion/player` would ship Remotion + the composition to every visitor.
 */
export function HeroVideo({ src, poster, label, aspect = "9 / 16" }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // The element may have failed or loaded before hydration, and a failing <source> does not
    // always surface an event afterwards. Read the current state now and once more shortly after.
    const sync = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setStatus("ready");
      else if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setStatus("missing");
    };
    sync();
    const recheck = window.setTimeout(sync, 2500);

    const onReady = () => setStatus("ready");
    const onError = () => setStatus("missing");
    const source = video.querySelector("source");

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    source?.addEventListener("error", onError);
    return () => {
      window.clearTimeout(recheck);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      source?.removeEventListener("error", onError);
    };
  }, []);

  const toggleAudio = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play().catch(() => undefined);
  };

  return (
    <figure className="flex w-full flex-col border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="tag truncate">{label}</span>
        <span className="tag shrink-0" aria-live="polite">
          {status === "ready" ? (muted ? "MUTED" : "AUDIO ON") : status === "missing" ? "OFFLINE" : "BUFFER"}
        </span>
      </figcaption>

      <div className="relative w-full overflow-hidden bg-bg" style={{ aspectRatio: aspect }}>
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            status === "ready" ? "opacity-100" : "opacity-0"
          }`}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label="Manifiesto BxY contra Shopify"
        >
          <source src={src} type="video/mp4" />
        </video>

        {status === "loading" && (
          <div className="grid-texture absolute inset-0 animate-pulse opacity-60" aria-hidden="true" />
        )}

        {status === "missing" && (
          <div className="grid-texture absolute inset-0 flex flex-col items-start justify-end gap-2 p-5">
            <p className="font-mono text-[12px] text-fg">Render pendiente.</p>
            <p className="max-w-[32ch] font-mono text-[11px] leading-relaxed text-muted">
              Copia el MP4 de apps/video-engine a public{src} para activarlo.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
        <span className="tag">REMOTION + ELEVENLABS</span>
        <button
          type="button"
          onClick={toggleAudio}
          disabled={status !== "ready"}
          aria-pressed={!muted}
          className="font-mono text-[11px] font-semibold uppercase text-fg transition-colors hover:text-accent disabled:cursor-not-allowed disabled:text-muted"
        >
          {muted ? "[ ACTIVAR AUDIO ]" : "[ SILENCIAR ]"}
        </button>
      </div>
    </figure>
  );
}
