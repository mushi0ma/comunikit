import { lazy, type ComponentType } from "react";

export const FLOOR_COMPONENTS: Record<
  string,
  ReturnType<typeof lazy<ComponentType>>
> = {
  // Full-campus view — all 3 blocks (MapLayout viewBox 924.69×396.16)
  "all-1": lazy(() => import("./C1_ALL_1")),
  "all-2": lazy(() => import("./C1_ALL_2")),
  "all-3": lazy(() => import("./C1_ALL_3")),
  // Block 1 — LayoutMinimap (viewBox 347.52×354.54)
  "C1.1-1": lazy(() => import("./C1_1_1")),
  "C1.1-2": lazy(() => import("./C1_1_2")),
  "C1.1-3": lazy(() => import("./C1_1_3")),
  // Block 2 — LayoutMinimapMiddle (viewBox 328.03×329.11)
  "C1.2-1": lazy(() => import("./C1_2_1")),
  "C1.2-2": lazy(() => import("./C1_2_2")),
  "C1.2-3": lazy(() => import("./C1_2_3")),
  // Block 3 — LayoutMinimap (viewBox 347.52×354.54)
  "C1.3-1": lazy(() => import("./C1_3_1")),
  "C1.3-2": lazy(() => import("./C1_3_2")),
  "C1.3-3": lazy(() => import("./C1_3_3")),
};
