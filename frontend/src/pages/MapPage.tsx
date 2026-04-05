/* comunikit — MapPage (Lost & Found Interactive Map)
   Design: custom SVG campus map with glowing red/green markers
*/
import { useState } from "react";
import { MapPin, Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { MOCK_LISTINGS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type MarkerType = "lost" | "found";

interface CampusMarker {
  id: string;
  type: MarkerType;
  x: number;
  y: number;
  title: string;
  location: string;
  time: string;
  listingId: string;
}

const MAP_MARKERS: CampusMarker[] = [
  { id: "1", type: "lost", x: 30, y: 45, title: "Потерян AirPods Pro", location: "Библиотека, 3-й этаж", time: "5h ago", listingId: "2" },
  { id: "2", type: "found", x: 55, y: 60, title: "Найдено студ. удостоверение", location: "Столовая, вход", time: "1d ago", listingId: "3" },
  { id: "3", type: "lost", x: 70, y: 35, title: "Потерян Samsung Galaxy S23", location: "Аудитория 301", time: "30m ago", listingId: "8" },
  { id: "4", type: "found", x: 45, y: 25, title: "Найдены ключи", location: "Коридор 2-го этажа", time: "2d ago", listingId: "3" },
  { id: "5", type: "lost", x: 20, y: 70, title: "Потерян рюкзак", location: "Вход в корпус", time: "3h ago", listingId: "2" },
];

// Schematic campus buildings (percentage-based rects)
const BUILDINGS = [
  { x: 12, y: 18, w: 22, h: 18, label: "A" },
  { x: 40, y: 14, w: 18, h: 14, label: "B" },
  { x: 62, y: 22, w: 24, h: 20, label: "C" },
  { x: 14, y: 58, w: 20, h: 24, label: "D" },
  { x: 42, y: 52, w: 22, h: 16, label: "E" },
  { x: 68, y: 60, w: 20, h: 22, label: "F" },
];

const FILTERS = [
  { value: "all", label: "Все" },
  { value: "lost", label: "Потеряно" },
  { value: "found", label: "Найдено" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function MapPage() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [activeMarker, setActiveMarker] = useState<CampusMarker | null>(null);

  const visibleMarkers = MAP_MARKERS.filter(m => filter === "all" || m.type === filter);

  return (
    <AppLayout title="Карта кампуса">
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Lost & Found карта
            </h2>
            <p className="text-sm text-muted-foreground">Кампус AITUC · {MAP_MARKERS.length} меток</p>
          </div>
          <Button onClick={() => navigate("/create")} className="gap-2 text-sm">
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map(f => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
              >
                {f.value === "lost" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 align-middle" />}
                {f.value === "found" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 align-middle" />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Custom SVG map */}
        <div className="relative w-full aspect-[16/9] bg-card border border-border rounded-xl overflow-hidden">
          {/* Dark background */}
          <div className="absolute inset-0 bg-zinc-900">
            {/* Grid lines */}
            <svg className="w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <pattern id="campusGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#64748b" strokeWidth="0.15" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#campusGrid)" />
              {/* Main pathways */}
              <line x1="0" y1="45" x2="100" y2="45" stroke="#475569" strokeWidth="0.6" strokeDasharray="1.5,1" />
              <line x1="38" y1="0" x2="38" y2="100" stroke="#475569" strokeWidth="0.6" strokeDasharray="1.5,1" />
              <line x1="66" y1="0" x2="66" y2="100" stroke="#475569" strokeWidth="0.6" strokeDasharray="1.5,1" />
            </svg>

            {/* Building blocks */}
            {BUILDINGS.map(b => (
              <div
                key={b.label}
                className="absolute rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center"
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <span className="text-zinc-500 text-xs font-bold tracking-wider">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Markers */}
          {visibleMarkers.map(m => {
            const isActive = activeMarker?.id === m.id;
            return (
              <button
                key={m.id}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 active:scale-95"
                onClick={() => setActiveMarker(isActive ? null : m)}
                aria-label={m.title}
              >
                <div
                  className={cn(
                    "size-3 rounded-full border-2 border-background",
                    "shadow-[0_0_8px_currentColor]",
                    m.type === "lost" ? "bg-red-400 text-red-400" : "bg-green-400 text-green-400",
                    isActive && "ring-2 ring-white/80 scale-125"
                  )}
                />
              </button>
            );
          })}

          {/* Popup */}
          {activeMarker && (
            <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 ck-animate-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5",
                      activeMarker.type === "lost"
                        ? "bg-red-500/15 text-red-500"
                        : "bg-green-500/15 text-green-500"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        activeMarker.type === "lost" ? "bg-red-500" : "bg-green-500"
                      )}
                    />
                    {activeMarker.type === "lost" ? "ПОТЕРЯНО" : "НАЙДЕНО"}
                  </span>
                  <p className="text-sm font-bold text-foreground leading-snug truncate">
                    {activeMarker.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeMarker.location}</p>
                  <p className="text-xs text-muted-foreground">{activeMarker.time}</p>
                </div>
                <button
                  onClick={() => setActiveMarker(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => navigate(`/listing/${activeMarker.listingId}`)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Открыть объявление <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Legend */}
          {!activeMarker && (
            <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-lg px-2.5 py-2 flex flex-col gap-1 border border-border">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="size-2 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
                <span className="text-foreground font-semibold">Потеряно</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="size-2 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80]" />
                <span className="text-foreground font-semibold">Найдено</span>
              </div>
            </div>
          )}
        </div>

        {/* Listings below map */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-foreground">Последние находки и потери</h3>
          {MOCK_LISTINGS.filter(l => l.type === "lost" || l.type === "found").map(l => (
            <button
              key={l.id}
              onClick={() => navigate(`/listing/${l.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-left hover:border-primary/50 transition-colors"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                  l.type === "lost" ? "bg-red-500" : "bg-green-500"
                )}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {l.location || "Место не указано"} · {l.createdAt}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
