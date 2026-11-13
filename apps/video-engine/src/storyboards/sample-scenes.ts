import type { VideoStoryboardScene } from "@bxy/shared-types";

// Fixed fallback durations. Once ElevenLabs audio exists, durationInFrames
// must be recomputed from the real audio length (see bxy-video-director skill).
export const sampleScenes: VideoStoryboardScene[] = [
  {
    id: "hook",
    kind: "hook",
    text: "TU TIENDA. TU EDGE.",
    voiceover: "[confident] Tu tienda. <break time=\"0.3s\"/> Tu edge.",
    durationInFrames: 60,
  },
  {
    id: "price",
    kind: "price",
    text: "$350.000 + IVA / PAGO ÚNICO",
    voiceover: "trescientos cincuenta mil pesos más IVA. Pago único.",
    durationInFrames: 90,
  },
  {
    id: "cta",
    kind: "cta",
    text: "BXY.CL",
    voiceover: "B por Y punto c l.",
    durationInFrames: 60,
  },
];
