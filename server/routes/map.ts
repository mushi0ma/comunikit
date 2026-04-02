import { Router, Request, Response } from "express";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = resolve(__dirname, "../data/maps");

const AREA_TYPES = [
  "classroom",
  "lab",
  "corridor",
  "stairs",
  "entrance",
  "canteen",
  "library",
  "office",
  "restroom",
  "service",
  "conference",
] as const;

const AreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(AREA_TYPES),
  path: z.string(),
  center: z.object({ x: z.number(), y: z.number() }),
});

const FloorSchema = z.object({
  building: z.string(),
  floor: z.number(),
  viewBox: z.string(),
  areas: z.array(AreaSchema),
});

export type FloorMap = z.infer<typeof FloorSchema>;
export type MapArea = z.infer<typeof AreaSchema>;

const paramsSchema = z.object({
  building: z.string().regex(/^[A-Z0-9]{1,4}$/, "Invalid building code"),
  floor: z.string().regex(/^\d{1,2}$/, "Invalid floor number"),
});

router.get("/:building/:floor", (req: Request, res: Response): void => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: parsed.error.issues[0]?.message ?? "Invalid parameters",
    });
    return;
  }

  const { building, floor } = parsed.data;
  const filePath = resolve(DATA_DIR, building, `${floor}.json`);

  if (!existsSync(filePath)) {
    res.status(404).json({
      success: false,
      data: null,
      error: `Floor plan not found: building=${building}, floor=${floor}`,
    });
    return;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      error: "Failed to read floor plan data",
    });
    return;
  }

  const result = FloorSchema.safeParse(raw);
  if (!result.success) {
    res.status(500).json({
      success: false,
      data: null,
      error: "Floor plan data is malformed",
    });
    return;
  }

  res.json({ success: true, data: result.data, error: null });
});

export default router;
