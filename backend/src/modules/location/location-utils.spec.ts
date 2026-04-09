/**
 * Unit tests for the campus location resolver algorithm (frontend/src/lib/locationUtils.ts).
 *
 * The functions are pure math with zero dependencies, so we inline them here
 * to test within the backend Jest environment without cross-project imports.
 */

// ── Inlined pure functions from locationUtils.ts ──────────

interface RoomEntry {
  id: string;
  name: string;
  block: string;
  floor: number;
  cx: number;
  cy: number;
  polygon: [number, number][];
}

interface ResolvedLocation {
  text: string;
  block: string;
  floor: number;
  room: RoomEntry | null;
  nearbyRooms: RoomEntry[];
}

const BLOCK_LABELS: Record<string, string> = {
  'C1.1': 'Блок C1.1',
  'C1.2': 'Блок C1.2',
  'C1.3': 'Блок C1.3',
};

const FLOOR_LABELS: Record<number, string> = {
  1: '1 этаж',
  2: '2 этаж',
  3: '3 этаж',
};

const NEAR_RADIUS = 3;
const CORRIDOR_RADIUS = 8;

function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distSq(x1: number, y1: number, x2: number, y2: number): number {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

function roomDisplayName(room: RoomEntry): string {
  if (room.name !== room.id) return room.name;
  const parts = room.id.split('.');
  if (parts.length === 3) return `каб. ${parts[2]}`;
  return room.id;
}

function resolveLocation(x: number, y: number, floor: number, roomData: RoomEntry[]): ResolvedLocation {
  const floorRooms = roomData.filter((r) => r.floor === floor);

  for (const room of floorRooms) {
    if (pointInPolygon(x, y, room.polygon)) {
      const blockLabel = BLOCK_LABELS[room.block] ?? room.block;
      const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
      return { text: `${blockLabel}, ${floorLabel}, ${roomDisplayName(room)}`, block: room.block, floor, room, nearbyRooms: [] };
    }
  }

  const nearRadiusSq = NEAR_RADIUS ** 2;
  const nearRooms = floorRooms
    .map((room) => ({ room, d: distSq(x, y, room.cx, room.cy) }))
    .filter((r) => r.d <= nearRadiusSq)
    .sort((a, b) => a.d - b.d);

  if (nearRooms.length > 0) {
    const closest = nearRooms[0].room;
    const blockLabel = BLOCK_LABELS[closest.block] ?? closest.block;
    const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
    return { text: `${blockLabel}, ${floorLabel}, ${roomDisplayName(closest)}`, block: closest.block, floor, room: closest, nearbyRooms: nearRooms.slice(1).map((r) => r.room) };
  }

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
    const names = corridorRooms.map((r) => roomDisplayName(r.room)).join(' / ');
    return { text: `${blockLabel}, ${floorLabel}, возле ${names}`, block: first.block, floor, room: null, nearbyRooms: corridorRooms.map((r) => r.room) };
  }

  const allByDist = floorRooms
    .map((room) => ({ room, d: distSq(x, y, room.cx, room.cy) }))
    .sort((a, b) => a.d - b.d);

  if (allByDist.length > 0) {
    const closest = allByDist[0].room;
    const blockLabel = BLOCK_LABELS[closest.block] ?? closest.block;
    const floorLabel = FLOOR_LABELS[floor] ?? `${floor} этаж`;
    return { text: `${blockLabel}, ${floorLabel}, возле ${roomDisplayName(closest)}`, block: closest.block, floor, room: null, nearbyRooms: [closest] };
  }

  return { text: `${floor} этаж`, block: '', floor, room: null, nearbyRooms: [] };
}

function parseMapCoords(locationText: string): { x: number; y: number } | null {
  const match = locationText.match(/[Кк]арта:\s*x=([\d.]+),?\s*y=([\d.]+)/);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

// ── Test fixtures ─────────────────────────────────────────

const ROOM_A: RoomEntry = {
  id: 'C1.1.168',
  name: 'C1.1.168',
  block: 'C1.1',
  floor: 1,
  cx: 50,
  cy: 50,
  polygon: [[45, 45], [55, 45], [55, 55], [45, 55]],
};

const ROOM_B: RoomEntry = {
  id: 'DININGHALL',
  name: 'Столовая',
  block: 'C1.3',
  floor: 1,
  cx: 80,
  cy: 70,
  polygon: [[75, 65], [85, 65], [85, 75], [75, 75]],
};

const ROOM_C: RoomEntry = {
  id: 'C1.2.251L',
  name: 'C1.2.251L',
  block: 'C1.2',
  floor: 2,
  cx: 30,
  cy: 30,
  polygon: [[25, 25], [35, 25], [35, 35], [25, 35]],
};

const TEST_ROOMS = [ROOM_A, ROOM_B, ROOM_C];

// ── Tests ─────────────────────────────────────────────────

describe('Location Utils — Algorithm Tests', () => {
  describe('pointInPolygon', () => {
    const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];

    it('returns true for point inside square', () => {
      expect(pointInPolygon(5, 5, square)).toBe(true);
    });

    it('returns false for point outside square', () => {
      expect(pointInPolygon(15, 5, square)).toBe(false);
    });

    it('returns false for point far away', () => {
      expect(pointInPolygon(100, 100, square)).toBe(false);
    });

    it('works with a triangle', () => {
      const triangle: [number, number][] = [[0, 0], [10, 0], [5, 10]];
      expect(pointInPolygon(5, 3, triangle)).toBe(true);
      expect(pointInPolygon(0, 10, triangle)).toBe(false);
    });

    it('works with an L-shaped polygon', () => {
      const lShape: [number, number][] = [
        [0, 0], [5, 0], [5, 5], [10, 5], [10, 10], [0, 10],
      ];
      // Inside the L
      expect(pointInPolygon(2, 2, lShape)).toBe(true);
      expect(pointInPolygon(7, 7, lShape)).toBe(true);
      // Outside the L (upper-right notch)
      expect(pointInPolygon(7, 2, lShape)).toBe(false);
    });

    it('handles negative coordinates', () => {
      const neg: [number, number][] = [[-5, -5], [5, -5], [5, 5], [-5, 5]];
      expect(pointInPolygon(0, 0, neg)).toBe(true);
      expect(pointInPolygon(-6, 0, neg)).toBe(false);
    });
  });

  describe('distSq', () => {
    it('returns 0 for same point', () => {
      expect(distSq(3, 4, 3, 4)).toBe(0);
    });

    it('returns correct squared distance', () => {
      expect(distSq(0, 0, 3, 4)).toBe(25); // 3² + 4² = 25
    });

    it('is symmetric', () => {
      expect(distSq(1, 2, 3, 4)).toBe(distSq(3, 4, 1, 2));
    });

    it('works with negative coordinates', () => {
      expect(distSq(-1, -1, 2, 3)).toBe(25); // 3² + 4² = 25
    });
  });

  describe('roomDisplayName', () => {
    it('returns friendly name for named zones', () => {
      expect(roomDisplayName(ROOM_B)).toBe('Столовая');
    });

    it('returns каб. N for numbered rooms (3-part id)', () => {
      expect(roomDisplayName(ROOM_A)).toBe('каб. 168');
    });

    it('returns raw id for non-standard format', () => {
      const room: RoomEntry = { ...ROOM_A, id: 'SPECIAL', name: 'SPECIAL' };
      expect(roomDisplayName(room)).toBe('SPECIAL');
    });
  });

  describe('resolveLocation', () => {
    it('returns exact room when point is inside polygon', () => {
      const result = resolveLocation(50, 50, 1, TEST_ROOMS);
      expect(result.room).toBe(ROOM_A);
      expect(result.text).toContain('Блок C1.1');
      expect(result.text).toContain('1 этаж');
      expect(result.text).toContain('каб. 168');
      expect(result.block).toBe('C1.1');
    });

    it('resolves named zone (Столовая) correctly', () => {
      const result = resolveLocation(80, 70, 1, TEST_ROOMS);
      expect(result.room).toBe(ROOM_B);
      expect(result.text).toContain('Столовая');
      expect(result.block).toBe('C1.3');
    });

    it('filters rooms by floor', () => {
      // ROOM_C is on floor 2, so resolving on floor 1 should NOT find it
      const result = resolveLocation(30, 30, 1, TEST_ROOMS);
      expect(result.room).not.toBe(ROOM_C);
    });

    it('finds room on floor 2', () => {
      const result = resolveLocation(30, 30, 2, TEST_ROOMS);
      expect(result.room).toBe(ROOM_C);
      expect(result.text).toContain('2 этаж');
      expect(result.text).toContain('Блок C1.2');
    });

    it('returns "возле" text when point is in corridor (outside polygon, within radius)', () => {
      // Point at (60, 50) is outside ROOM_A polygon but within CORRIDOR_RADIUS of cx=50,cy=50
      const result = resolveLocation(57, 50, 1, TEST_ROOMS);
      expect(result.room).toBeNull();
      expect(result.text).toContain('возле');
      expect(result.nearbyRooms.length).toBeGreaterThan(0);
    });

    it('returns near room when point is within NEAR_RADIUS of centroid', () => {
      // Point at (51, 51) is 1.41 from centroid (50,50) — within NEAR_RADIUS=3
      const result = resolveLocation(51, 51, 1, [
        { ...ROOM_A, polygon: [[45, 45], [49, 45], [49, 49], [45, 49]] }, // shrunken polygon that doesn't contain (51,51)
      ]);
      expect(result.room?.id).toBe('C1.1.168');
      expect(result.text).toContain('каб. 168');
    });

    it('returns fallback for empty floor', () => {
      const result = resolveLocation(50, 50, 3, TEST_ROOMS);
      expect(result.text).toBe('3 этаж');
      expect(result.block).toBe('');
      expect(result.room).toBeNull();
      expect(result.nearbyRooms).toEqual([]);
    });

    it('uses fallback floor label for unknown floor numbers', () => {
      const room: RoomEntry = { ...ROOM_A, floor: 5 };
      const result = resolveLocation(50, 50, 5, [room]);
      expect(result.text).toContain('5 этаж');
    });

    it('uses raw block string when block not in BLOCK_LABELS', () => {
      const room: RoomEntry = { ...ROOM_A, block: 'D2.1' };
      const result = resolveLocation(50, 50, 1, [room]);
      expect(result.text).toContain('D2.1');
    });
  });

  describe('parseMapCoords', () => {
    it('parses "Карта: x=45.2, y=67.8"', () => {
      const result = parseMapCoords('Карта: x=45.2, y=67.8');
      expect(result).toEqual({ x: 45.2, y: 67.8 });
    });

    it('parses without comma separator', () => {
      const result = parseMapCoords('Карта: x=10 y=20');
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('parses lowercase "карта"', () => {
      const result = parseMapCoords('карта: x=1.5, y=2.5');
      expect(result).toEqual({ x: 1.5, y: 2.5 });
    });

    it('returns null for plain text locations', () => {
      expect(parseMapCoords('Блок C1.1, 1 этаж')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseMapCoords('')).toBeNull();
    });

    it('returns null for unrelated coordinate format', () => {
      expect(parseMapCoords('lat=51.5, lng=-0.1')).toBeNull();
    });

    it('handles integer coordinates', () => {
      const result = parseMapCoords('Карта: x=50, y=60');
      expect(result).toEqual({ x: 50, y: 60 });
    });
  });
});
