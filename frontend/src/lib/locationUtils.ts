/**
 * Coordinate-to-readable-location resolver for AITU campus.
 *
 * Takes map percentage coordinates (x, y) and a floor number,
 * returns a human-readable string like:
 *   "Блок C1.1, 1 этаж, каб. C1.1.168"
 *   "Блок C1.3, 1 этаж, Столовая"
 *   "Блок C1.2, 2 этаж, возле C1.2.251L"
 */
import { ROOM_DATA, type RoomEntry } from "./locationData";

const BLOCK_LABELS: Record<string, string> = {
  "C1.1": "Блок C1.1",
  "C1.2": "Блок C1.2",
  "C1.3": "Блок C1.3",
};

const FLOOR_LABELS: Record<number, string> = {
  1: "1 этаж",
  2: "2 этаж",
  3: "3 этаж",
};

/** Maximum distance (in %) to consider a point "inside or very near" a room */
const NEAR_RADIUS = 3;

/** Maximum distance (in %) to consider for "near room X" labeling */
const CORRIDOR_RADIUS = 8;

/** Point-in-polygon test (ray casting) */
function pointInPolygon(
  x: number,
  y: number,
  polygon: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Squared Euclidean distance between two points */
function distSq(x1: number, y1: number, x2: number, y2: number): number {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

/** Get display name for a room (short form for named zones, room number otherwise) */
function roomDisplayName(room: RoomEntry): string {
  // Named zones already have a friendly name
  if (room.name !== room.id) return room.name;
  // For numbered rooms like "C1.1.168", extract just the number part
  const parts = room.id.split(".");
  if (parts.length === 3) return `каб. ${parts[2]}`;
  return room.id;
}

export interface ResolvedLocation {
  text: string;
  block: string;
  floor: number;
  room: RoomEntry | null;
  nearbyRooms: RoomEntry[];
}

/**
 * Resolve percentage coordinates to a human-readable location string.
 *
 * @param x - X coordinate in % of full-campus map (0-100)
 * @param y - Y coordinate in % of full-campus map (0-100)
 * @param floor - Floor number (1, 2, or 3)
 * @returns ResolvedLocation with human-readable text
 */
export function resolveLocation(
  x: number,
  y: number,
  floor: number,
): ResolvedLocation {
  const floorRooms = ROOM_DATA.filter((r) => r.floor === floor);

  // 1. Check if point is inside any room polygon
  for (const room of floorRooms) {
    if (pointInPolygon(x, y, room.polygon)) {
      const blockLabel = BLOCK_LABELS[room.block] ?? room.block;
      const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
      return {
        text: `${blockLabel}, ${floorLabel}, ${roomDisplayName(room)}`,
        block: room.block,
        floor,
        room,
        nearbyRooms: [],
      };
    }
  }

  // 2. Find rooms within NEAR_RADIUS (centroid distance)
  const nearRadiusSq = NEAR_RADIUS ** 2;
  const nearRooms = floorRooms
    .map((room) => ({ room, d: distSq(x, y, room.cx, room.cy) }))
    .filter((r) => r.d <= nearRadiusSq)
    .sort((a, b) => a.d - b.d);

  if (nearRooms.length > 0) {
    const closest = nearRooms[0].room;
    const blockLabel = BLOCK_LABELS[closest.block] ?? closest.block;
    const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
    return {
      text: `${blockLabel}, ${floorLabel}, ${roomDisplayName(closest)}`,
      block: closest.block,
      floor,
      room: closest,
      nearbyRooms: nearRooms.slice(1).map((r) => r.room),
    };
  }

  // 3. Find 1-2 nearest rooms within CORRIDOR_RADIUS → "near X"
  const corridorSq = CORRIDOR_RADIUS ** 2;
  const corridorRooms = floorRooms
    .map((room) => ({ room, d: distSq(x, y, room.cx, room.cy) }))
    .filter((r) => r.d <= corridorSq)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);

  if (corridorRooms.length > 0) {
    const first = corridorRooms[0].room;
    const blockLabel = BLOCK_LABELS[first.block] ?? first.block;
    const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
    const names = corridorRooms.map((r) => roomDisplayName(r.room)).join(" / ");
    return {
      text: `${blockLabel}, ${floorLabel}, возле ${names}`,
      block: first.block,
      floor,
      room: null,
      nearbyRooms: corridorRooms.map((r) => r.room),
    };
  }

  // 4. Fallback: find the single nearest room on this floor
  const allByDist = floorRooms
    .map((room) => ({ room, d: distSq(x, y, room.cx, room.cy) }))
    .sort((a, b) => a.d - b.d);

  if (allByDist.length > 0) {
    const closest = allByDist[0].room;
    const blockLabel = BLOCK_LABELS[closest.block] ?? closest.block;
    const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
    return {
      text: `${blockLabel}, ${floorLabel}, возле ${roomDisplayName(closest)}`,
      block: closest.block,
      floor,
      room: null,
      nearbyRooms: [closest],
    };
  }

  // 5. No rooms on this floor at all (shouldn't happen)
  return {
    text: `${floor} этаж`,
    block: "",
    floor,
    room: null,
    nearbyRooms: [],
  };
}

/**
 * Parse raw location text that may contain map coordinates.
 * Handles strings like "Карта: x=45.2, y=67.8" from CreateListing.
 */
export function parseMapCoords(
  locationText: string,
): { x: number; y: number } | null {
  const match = locationText.match(
    /[Кк]арта:\s*x=([\d.]+),?\s*y=([\d.]+)/,
  );
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

/**
 * Convert raw location text to a resolved location string.
 * If the text contains map coordinates, resolves them; otherwise returns the text as-is.
 */
export function resolveLocationText(
  locationText: string,
  floor: number = 1,
): string {
  const coords = parseMapCoords(locationText);
  if (!coords) return locationText;
  return resolveLocation(coords.x, coords.y, floor).text;
}
