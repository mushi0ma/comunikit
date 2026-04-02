/**
 * parseMap.ts — Campus floor plan data generator
 *
 * Original intent: parse legacy JSX files from `server/aitumap_source/src/shared/ui/`
 * that contained hardcoded SVG paths for each campus floor (e.g. C1_1.tsx, C1_2.tsx).
 *
 * Since those JSX source files are not present in this repo, this script instead
 * validates and re-emits the hand-authored JSON files in `server/data/maps/`.
 * Run this after editing any JSON floor plan file to catch schema errors early.
 *
 * Usage:
 *   npx tsx server/scripts/parseMap.ts
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

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

function processBuilding(building: string): void {
  const buildingDir = resolve(DATA_DIR, building);
  const files = readdirSync(buildingDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = resolve(buildingDir, file);
    const floorNum = basename(file, ".json");

    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`  [ERROR] ${building}/${file}: invalid JSON — ${String(err)}`);
      process.exitCode = 1;
      continue;
    }

    const result = FloorSchema.safeParse(raw);
    if (!result.success) {
      console.error(`  [ERROR] ${building}/${file}: schema error —`);
      result.error.issues.forEach((issue) =>
        console.error(`    ${issue.path.join(".")} — ${issue.message}`)
      );
      process.exitCode = 1;
      continue;
    }

    // Re-emit normalised (sorted areas by id) for deterministic output
    const normalised = {
      ...result.data,
      areas: [...result.data.areas].sort((a, b) => a.id.localeCompare(b.id)),
    };
    writeFileSync(filePath, JSON.stringify(normalised, null, 2) + "\n", "utf-8");
    console.log(`  [OK] ${building}/floor ${floorNum} — ${normalised.areas.length} areas`);
  }
}

function main(): void {
  if (!existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  const buildings = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (buildings.length === 0) {
    console.log("No building directories found.");
    return;
  }

  for (const building of buildings) {
    console.log(`Building: ${building}`);
    processBuilding(building);
  }

  if (process.exitCode === 1) {
    console.error("\nParseMap finished with errors.");
  } else {
    console.log("\nParseMap finished successfully.");
  }
}

main();
