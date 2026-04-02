export interface MapArea {
  id: string;
  name: string;
  type:
    | "classroom"
    | "lab"
    | "corridor"
    | "stairs"
    | "entrance"
    | "canteen"
    | "library"
    | "office"
    | "restroom"
    | "service"
    | "conference";
  path: string;
  center: { x: number; y: number };
}

export interface FloorMap {
  building: string;
  floor: number;
  viewBox: string;
  areas: MapArea[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export async function fetchFloorMap(
  building: string,
  floor: number
): Promise<FloorMap> {
  const res = await fetch(`/api/map/${encodeURIComponent(building)}/${floor}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json: ApiResponse<FloorMap> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error ?? "Unknown error");
  }
  return json.data;
}
