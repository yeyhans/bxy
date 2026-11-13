import type { BrandConfig } from "@bxy/shared-types";

export const bxyBrand: BrandConfig = {
  slug: "bxy",
  name: "BxY",
  domain: "bxy.cl",
  logo: { light: "brands/bxy/logo-light.svg", dark: "brands/bxy/logo-dark.svg" },
  palette: {
    background: "#0A0A0A",
    foreground: "#F5F5F5",
    accent: "#FFFFFF",
    muted: "#737373",
    border: "#262626",
  },
  typography: {
    mono: "JetBrains Mono",
    display: "Geist",
    body: "Geist",
  },
  voice: {
    elevenLabsVoiceId: "TODO_SET_VOICE_ID",
    locale: "es-CL",
    phonetics: {
      BxY: "B por Y",
      "$350.000 + IVA": "trescientos cincuenta mil pesos más IVA",
    },
  },
};
