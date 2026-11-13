import type { BrandConfig } from "@bxy/shared-types";

/** Static brand label drawn over pre-rendered, brand-neutral studio footage. */
export const BrandTag = ({ brand }: { brand: BrandConfig }) => (
  <div
    style={{
      position: "absolute",
      top: 72,
      left: 56,
      padding: "8px 16px",
      border: `1px solid ${brand.palette.border}`,
      backgroundColor: brand.palette.background,
      color: brand.palette.foreground,
      fontFamily: brand.typography.mono,
      fontSize: 28,
      letterSpacing: 2,
      textTransform: "uppercase",
    }}
  >
    {brand.name}
  </div>
);
