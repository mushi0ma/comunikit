/**
 * Extract room IDs, polygon vertices, and centroids from C1_ALL_*.jsx floor files.
 * Outputs a TypeScript data file at frontend/src/lib/locationData.ts
 *
 * Usage: node scripts/extract-rooms.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FLOORS_DIR = join(ROOT, "frontend/src/features/map/floors");

// Full-campus viewBox dimensions
const VB_W = 924.69;
const VB_H = 396.16;

// Named zones with human-readable labels (Russian)
const NAMED_ZONES = {
  ASSEMBLYHALL: "Актовый зал",
  LIBRARY: "Библиотека",
  MEDIKER: "Медикер",
  ATAMEKEN: "Коворкинг Атамекен",
  DININGHALL: "Столовая",
  GARDEROB: "Гардероб",
};

function parsePoints(pointsStr) {
  const nums = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n));
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push([nums[i], nums[i + 1]]);
  }
  return pts;
}

function centroid(pts) {
  if (pts.length === 0) return [0, 0];
  let cx = 0,
    cy = 0;
  for (const [x, y] of pts) {
    cx += x;
    cy += y;
  }
  return [cx / pts.length, cy / pts.length];
}

function toPercent(svgX, svgY) {
  return [(svgX / VB_W) * 100, (svgY / VB_H) * 100];
}

function extractRooms(filePath, floorNum) {
  const src = readFileSync(filePath, "utf-8");
  const rooms = [];

  // Track which parent block (C1.1, C1.2, C1.3) we're inside
  let currentBlock = "";

  // Join multi-line <g> tags into single lines for easier parsing
  const normalized = src.replace(/<g\s*\n\s+/g, "<g ");

  const lines = normalized.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track block context: <g id="C1.1">, <g id="C1.2">, <g id="C1.3">
    const blockMatch = line.match(/<g\s+id="(C1\.[123])"/);
    if (blockMatch) {
      currentBlock = blockMatch[1];
      continue;
    }

    const idMatch = line.match(/id="([^"]+)"/);
    const dnMatch = line.match(/data-name="([^"]+)"/);

    const gId = idMatch ? idMatch[1] : "";
    const dataName = dnMatch ? dnMatch[1] : "";

    // Must be a <g> tag
    if (!line.includes("<g") || (!gId && !dataName)) continue;

    let roomId = "";
    let displayName = "";
    let block = currentBlock;

    // Case 1: Standard room ID like C1.1.168
    if (/^C1\.\d\.\d+\w*$/.test(gId)) {
      roomId = gId;
      block = gId.split(".").slice(0, 2).join(".");
      displayName = gId;
    }
    // Case 2: Named room like C1.2.GARDEROB
    else if (/^C1\.\d\.\w+$/.test(gId) && !gId.match(/^C1\.[123]$/)) {
      const nameKey = gId.split(".")[2];
      if (NAMED_ZONES[nameKey]) {
        roomId = gId;
        block = gId.split(".").slice(0, 2).join(".");
        displayName = NAMED_ZONES[nameKey];
      } else continue;
    }
    // Case 2b: Bare named zone id like "DININGHALL", "ATAMEKEN"
    else if (NAMED_ZONES[gId]) {
      roomId = gId;
      displayName = NAMED_ZONES[gId];
      block = currentBlock;
    }
    // Case 3: data-name with known zone (no useful id)
    else if (dataName) {
      const firstName = dataName.split("|")[0].replace(/^C1\.\d\./, "");
      if (NAMED_ZONES[firstName]) {
        roomId = firstName;
        displayName = NAMED_ZONES[firstName];
        // Try to get block from data-name parts
        for (const part of dataName.split("|")) {
          const bm = part.match(/C1\.(\d)/);
          if (bm) {
            block = `C1.${bm[1]}`;
            break;
          }
        }
        // If still no block, use current context
        if (!block) block = currentBlock;
      }
      // Case 4: data-name is a room number like "2.139"
      else if (/^\d\.\d+/.test(dataName)) {
        const blockNum = dataName[0];
        block = `C1.${blockNum}`;
        roomId = gId || `C1.${dataName}`;
        displayName = gId || `C1.${dataName}`;
      } else continue;
    } else continue;

    if (!roomId || !block) continue;

    // Collect content until the closing </g> — scan forward
    let groupContent = "";
    let depth = 0;
    for (let j = i; j < lines.length; j++) {
      const l = lines[j];
      groupContent += l + "\n";
      // Count <g opening and </g> closing
      const opens = (l.match(/<g[\s>]/g) || []).length;
      const closes = (l.match(/<\/g>/g) || []).length;
      depth += opens - closes;
      if (depth <= 0 && j > i) break;
      // Safety: don't scan too far
      if (j - i > 50) break;
    }

    // Extract polygon/polyline points
    const pointsRe = /points="([^"]+)"/g;
    let bestPoints = [];
    let pm;
    while ((pm = pointsRe.exec(groupContent)) !== null) {
      const pts = parsePoints(pm[1]);
      if (pts.length > bestPoints.length) {
        bestPoints = pts;
      }
    }

    if (bestPoints.length < 3) continue;

    const [cx, cy] = centroid(bestPoints);
    const [pctX, pctY] = toPercent(cx, cy);
    const pctPolygon = bestPoints.map(([x, y]) => toPercent(x, y));

    rooms.push({
      id: roomId,
      name: displayName,
      block,
      floor: floorNum,
      cx: Math.round(pctX * 100) / 100,
      cy: Math.round(pctY * 100) / 100,
      polygon: pctPolygon.map(([x, y]) => [
        Math.round(x * 100) / 100,
        Math.round(y * 100) / 100,
      ]),
    });
  }

  return rooms;
}

// Extract from all 3 floor files
const allRooms = [];
for (let floor = 1; floor <= 3; floor++) {
  const file = join(FLOORS_DIR, `C1_ALL_${floor}.jsx`);
  console.log(`Parsing ${file}...`);
  const rooms = extractRooms(file, floor);
  console.log(`  Found ${rooms.length} rooms on floor ${floor}`);
  allRooms.push(...rooms);
}

console.log(`\nTotal rooms extracted: ${allRooms.length}`);

// Deduplicate by roomId+floor
const seen = new Set();
const unique = allRooms.filter((r) => {
  const key = `${r.id}-${r.floor}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Unique rooms: ${unique.length}`);

// Generate TypeScript output
const tsLines = [
  "/* Auto-generated by scripts/extract-rooms.mjs — DO NOT EDIT MANUALLY */",
  "",
  "export interface RoomEntry {",
  "  id: string;",
  '  /** Human-readable name or room number like "C1.1.168" */',
  "  name: string;",
  '  /** Block: "C1.1", "C1.2", "C1.3" */',
  "  block: string;",
  "  /** Floor number: 1, 2, 3 */",
  "  floor: number;",
  "  /** Centroid X in % of full-campus viewBox (0-100) */",
  "  cx: number;",
  "  /** Centroid Y in % of full-campus viewBox (0-100) */",
  "  cy: number;",
  "  /** Polygon vertices in % coords [[x,y], ...] */",
  "  polygon: [number, number][];",
  "}",
  "",
  "export const ROOM_DATA: RoomEntry[] = ",
];

const json = JSON.stringify(unique, null, 2);
tsLines.push(json + ";");

const outPath = join(ROOT, "frontend/src/lib/locationData.ts");
writeFileSync(outPath, tsLines.join("\n") + "\n");
console.log(`\nWrote ${outPath}`);
