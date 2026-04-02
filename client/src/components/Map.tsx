import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFloorMap, type MapArea } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

const AREA_CLASSES: Record<MapArea["type"], string> = {
  classroom:
    "fill-blue-100 hover:fill-blue-300 stroke-blue-400 dark:fill-blue-900/40 dark:hover:fill-blue-700 dark:stroke-blue-600",
  lab: "fill-teal-100 hover:fill-teal-300 stroke-teal-400 dark:fill-teal-900/40 dark:hover:fill-teal-700 dark:stroke-teal-600",
  corridor:
    "fill-muted hover:fill-muted/60 stroke-border dark:fill-muted/30 dark:hover:fill-muted/50",
  stairs:
    "fill-yellow-100 hover:fill-yellow-300 stroke-yellow-400 dark:fill-yellow-900/40 dark:hover:fill-yellow-700 dark:stroke-yellow-600",
  entrance:
    "fill-green-100 hover:fill-green-300 stroke-green-400 dark:fill-green-900/40 dark:hover:fill-green-700 dark:stroke-green-600",
  canteen:
    "fill-orange-100 hover:fill-orange-300 stroke-orange-400 dark:fill-orange-900/40 dark:hover:fill-orange-700 dark:stroke-orange-600",
  library:
    "fill-purple-100 hover:fill-purple-300 stroke-purple-400 dark:fill-purple-900/40 dark:hover:fill-purple-700 dark:stroke-purple-600",
  office:
    "fill-slate-100 hover:fill-slate-300 stroke-slate-400 dark:fill-slate-800/60 dark:hover:fill-slate-700 dark:stroke-slate-500",
  restroom:
    "fill-rose-100 hover:fill-rose-300 stroke-rose-400 dark:fill-rose-900/40 dark:hover:fill-rose-700 dark:stroke-rose-600",
  service:
    "fill-zinc-100 hover:fill-zinc-300 stroke-zinc-400 dark:fill-zinc-800/60 dark:hover:fill-zinc-700 dark:stroke-zinc-500",
  conference:
    "fill-indigo-100 hover:fill-indigo-300 stroke-indigo-400 dark:fill-indigo-900/40 dark:hover:fill-indigo-700 dark:stroke-indigo-600",
};

const FLOORS = [1, 2, 3] as const;

interface FloorPlanMapProps {
  building?: string;
  className?: string;
}

export function FloorPlanMap({
  building = "C1",
  className,
}: FloorPlanMapProps) {
  const [floor, setFloor] = useState<number>(1);
  const [tooltip, setTooltip] = useState<{
    area: MapArea;
    x: number;
    y: number;
  } | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: ["floorMap", building, floor],
    queryFn: () => fetchFloorMap(building, floor),
  });

  return (
    <div className={cn("space-y-3", className)}>
      <ToggleGroup
        type="single"
        value={String(floor)}
        onValueChange={v => v && setFloor(Number(v))}
        className="justify-start"
      >
        {FLOORS.map(f => (
          <ToggleGroupItem
            key={f}
            value={String(f)}
            className="text-sm font-semibold"
          >
            {f} этаж
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
        {isPending && (
          <Skeleton className="w-full h-[420px] rounded-2xl" />
        )}

        {isError && (
          <div className="w-full h-[420px] flex items-center justify-center text-muted-foreground text-sm">
            Не удалось загрузить план этажа
          </div>
        )}

        {data && (
          <svg
            viewBox={data.viewBox}
            className="w-full h-auto max-h-[420px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {data.areas.map(area => (
              <g key={area.id}>
                <path
                  d={area.path}
                  strokeWidth={2}
                  className={cn(
                    "cursor-pointer transition-colors",
                    AREA_CLASSES[area.type]
                  )}
                  onMouseEnter={e => {
                    const svg = (e.currentTarget as SVGPathElement).closest(
                      "svg"
                    )!;
                    const rect = svg.getBoundingClientRect();
                    setTooltip({
                      area,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text
                  x={area.center.x}
                  y={area.center.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={18}
                  className="fill-foreground/60 pointer-events-none select-none"
                >
                  {area.name.length > 12
                    ? area.name.slice(0, 10) + "…"
                    : area.name}
                </text>
              </g>
            ))}
          </svg>
        )}

        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none bg-popover border border-border rounded-xl px-3 py-2 shadow-xl text-sm"
            style={{
              left: Math.min(tooltip.x + 8, 220),
              top: Math.max(tooltip.y - 40, 8),
            }}
          >
            <p className="font-bold text-foreground">{tooltip.area.name}</p>
            <p className="text-muted-foreground capitalize">
              {tooltip.area.type}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
