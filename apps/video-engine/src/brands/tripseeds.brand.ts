import type { BrandConfig } from "@bxy/shared-types";

// Blueprint 01. Palette and voice are placeholders until synced with the TripSeeds brand kit.
export const tripseedsBrand: BrandConfig = {
  slug: "tripseeds",
  name: "TripSeeds",
  domain: "TODO_SET_DOMAIN",
  logo: { light: "brands/tripseeds/logo-light.svg", dark: "brands/tripseeds/logo-dark.svg" },
  palette: {
    background: "#0B0B0B",
    foreground: "#F2F2F2",
    accent: "#9AE66E",
    muted: "#7A7A7A",
    border: "#2A2A2A",
  },
  typography: {
    mono: "JetBrains Mono",
    display: "Geist",
    body: "Geist",
  },
  voice: {
    elevenLabsVoiceId: "TODO_SET_VOICE_ID",
    locale: "es-CL",
    phonetics: {},
  },
  storeApiUrl: "TODO_SET_TRIPSEEDS_CORE_URL",
};
