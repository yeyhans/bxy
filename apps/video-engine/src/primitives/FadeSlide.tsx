import type { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Deterministic entrance: opacity + vertical slide driven only by the frame.
 * Never use CSS transitions, framer-motion or anime.js inside Remotion.
 */
export const FadeSlide = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const translateY = interpolate(progress, [0, 1], [40, 0]);

  return <div style={{ opacity: progress, transform: `translateY(${translateY}px)` }}>{children}</div>;
};
