import type { BrandConfig } from "@bxy/shared-types";
import { bxyBrand } from "./bxy.brand";
import { tripseedsBrand } from "./tripseeds.brand";

/** Register every new client brand here: one `<slug>.brand.ts` per client. */
export const brands: BrandConfig[] = [bxyBrand, tripseedsBrand];
