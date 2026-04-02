/* comunikit — FloorPlanMap (AITU SVG Floor Plan)
   Fetches building floor data from API and renders inline SVG paths.
   Uses Shadcn theme classes for consistent styling.
*/
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Area {
  id: string;
  name: string;
  d: string;
}

interface FloorData {
  viewBox: string;
  areas: Area[];
}

// Fallback floor plan when API is unavailable
const FALLBACK_FLOORS: Record<number, FloorData> = {
  1: {
    viewBox: "0 0 800 500",
    areas: [
      { id: "lobby", name: "Лобби", d: "M50 200 L250 200 L250 350 L50 350 Z" },
      { id: "lecture-101", name: "Аудитория 101", d: "M280 50 L480 50 L480 180 L280 180 Z" },
      { id: "lecture-102", name: "Аудитория 102", d: "M510 50 L710 50 L710 180 L510 180 Z" },
      { id: "cafeteria", name: "Столовая", d: "M280 210 L530 210 L530 380 L280 380 Z" },
      { id: "library", name: "Библиотека", d: "M560 210 L750 210 L750 380 L560 380 Z" },
      { id: "entrance", name: "Вход", d: "M50 380 L250 380 L250 450 L50 450 Z" },
    ],
  },
  2: {
    viewBox: "0 0 800 500",
    areas: [
      { id: "lab-201", name: "Лаборатория 201", d: "M50 50 L300 50 L300 200 L50 200 Z" },
      { id: "lab-202", name: "Лаборатория 202", d: "M330 50 L580 50 L580 200 L330 200 Z" },
      { id: "office", name: "Деканат", d: "M610 50 L750 50 L750 200 L610 200 Z" },
      { id: "lecture-201", name: "Аудитория 201", d: "M50 230 L350 230 L350 400 L50 400 Z" },
      { id: "coworking", name: "Коворкинг", d: "M380 230 L750 230 L750 400 L380 400 Z" },
    ],
  },
  3: {
    viewBox: "0 0 800 500",
    areas: [
      { id: "lecture-301", name: "Аудитория 301", d: "M50 50 L400 50 L400 220 L50 220 Z" },
      { id: "lecture-302", name: "Аудитория 302", d: "M430 50 L750 50 L750 220 L430 220 Z" },
      { id: "server", name: "Серверная", d: "M50 250 L200 250 L200 400 L50 400 Z" },
      { id: "study", name: "Зал самоподготовки", d: "M230 250 L550 250 L550 400 L230 400 Z" },
      { id: "admin", name: "Администрация", d: "M580 250 L750 250 L750 400 L580 400 Z" },
    ],
  },
};

interface FloorPlanMapProps {
  building?: string;
  floor?: number;
  className?: string;
  interactive?: boolean;
}

export function FloorPlanMap({
  building = "main",
  floor: initialFloor = 1,
  className,
  interactive = true,
}: FloorPlanMapProps) {
  const [floor, setFloor] = useState(initialFloor);
  const [floorData, setFloorData] = useState<FloorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const fetchFloor = useCallback(async (f: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/map/${building}/${f}`);
      if (!res.ok) throw new Error("API unavailable");
      const data: FloorData = await res.json();
      setFloorData(data);
    } catch {
      // Use fallback data when API is unavailable
      setFloorData(FALLBACK_FLOORS[f] ?? FALLBACK_FLOORS[1]);
    } finally {
      setLoading(false);
    }
  }, [building]);

  useEffect(() => {
    fetchFloor(floor);
  }, [floor, fetchFloor]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Floor toggle */}
      {interactive && (
        <div className="flex gap-1.5">
          {[1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-150",
                floor === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {f} этаж
            </button>
          ))}
        </div>
      )}

      {/* SVG Floor Plan */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Загрузка карты...
          </div>
        ) : floorData ? (
          <svg
            viewBox={floorData.viewBox}
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid background */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-border" strokeWidth="0.5" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Areas */}
            {floorData.areas.map((area) => (
              <g key={area.id}>
                <path
                  d={area.d}
                  className={cn(
                    "fill-muted stroke-border transition-colors duration-200 cursor-pointer",
                    hoveredArea === area.id && "fill-primary/20 stroke-primary"
                  )}
                  strokeWidth="2"
                  onMouseEnter={() => interactive && setHoveredArea(area.id)}
                  onMouseLeave={() => interactive && setHoveredArea(null)}
                />
                {/* Area label */}
                <text
                  x={getPathCenter(area.d).x}
                  y={getPathCenter(area.d).y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    "fill-muted-foreground text-[11px] font-semibold pointer-events-none select-none",
                    hoveredArea === area.id && "fill-primary"
                  )}
                >
                  {area.name}
                </text>
              </g>
            ))}
          </svg>
        ) : null}
      </div>
    </div>
  );
}

/** Approximate center of a rectangular SVG path for label placement */
function getPathCenter(d: string): { x: number; y: number } {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 4) return { x: 0, y: 0 };
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

export default FloorPlanMap;
