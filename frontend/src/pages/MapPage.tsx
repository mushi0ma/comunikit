/* comunikit — MapPage (Lost & Found Interactive Map)
   Design: "Digital Bazaar" — campus SVG map with red/green markers
*/
import { useState } from "react";
import { MapPin, Plus, Filter, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { MOCK_LISTINGS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";

const CAMPUS_MAP_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-campus-map-bg-T8ZyHrwYhDrtVNt496PAhT.webp";

const MAP_MARKERS = [
  { id: "1", type: "lost" as const, x: 30, y: 45, title: "Потерян AirPods Pro", location: "Библиотека, 3-й этаж", time: "5h ago", listingId: "2" },
  { id: "2", type: "found" as const, x: 55, y: 60, title: "Найдено студ. удостоверение", location: "Столовая, вход", time: "1d ago", listingId: "3" },
  { id: "3", type: "lost" as const, x: 70, y: 35, title: "Потерян Samsung Galaxy S23", location: "Аудитория 301", time: "30m ago", listingId: "8" },
  { id: "4", type: "found" as const, x: 45, y: 25, title: "Найдены ключи", location: "Коридор 2-го этажа", time: "2d ago", listingId: "3" },
  { id: "5", type: "lost" as const, x: 20, y: 70, title: "Потерян рюкзак", location: "Вход в корпус", time: "3h ago", listingId: "2" },
];

export default function MapPage() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "lost" | "found">("all");
  const [selectedMarker, setSelectedMarker] = useState<typeof MAP_MARKERS[0] | null>(null);

  const visibleMarkers = MAP_MARKERS.filter(m => filter === "all" || m.type === filter);

  return (
    <AppLayout title="Карта кампуса">
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Lost & Found карта
            </h2>
            <p className="text-sm text-muted-foreground">Кампус AITUC · {MAP_MARKERS.length} меток</p>
          </div>
          <Button
            onClick={() => navigate("/create")}
            className="gap-2 text-sm"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
          >
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>

        {/* Filter toggles */}
        <div className="flex gap-2">
          {([
            { value: "all", label: "Все", color: "bg-muted text-muted-foreground" },
            { value: "lost", label: "🔴 Потеряно", activeColor: "bg-red-500 text-white" },
            { value: "found", label: "🟢 Найдено", activeColor: "bg-green-500 text-white" },
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all",
                filter === opt.value
                  ? (opt.value === "lost" ? "bg-red-500 text-white" : opt.value === "found" ? "bg-green-500 text-white" : "bg-primary text-white")
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: "400px" }}>
          <img
            src={CAMPUS_MAP_BG}
            alt="Карта кампуса AITUC"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Markers */}
          {visibleMarkers.map(marker => (
            <button
              key={marker.id}
              onClick={() => setSelectedMarker(selectedMarker?.id === marker.id ? null : marker)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95"
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm",
                marker.type === "lost" ? "bg-red-500" : "bg-green-500",
                selectedMarker?.id === marker.id ? "ring-2 ring-white ring-offset-1 scale-110" : ""
              )}>
                <MapPin className="w-4 h-4" />
              </div>
            </button>
          ))}

          {/* Popup */}
          {selectedMarker && (
            <div
              className="absolute bg-card border border-border rounded-xl p-3 shadow-xl w-52 ck-animate-in"
              style={{
                left: `${Math.min(Math.max(selectedMarker.x, 20), 70)}%`,
                top: `${Math.min(selectedMarker.y + 5, 75)}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded-full",
                      selectedMarker.type === "lost" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                      {selectedMarker.type === "lost" ? "🔴 Потеряно" : "🟢 Найдено"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug">{selectedMarker.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedMarker.location}</p>
                  <p className="text-xs text-muted-foreground">{selectedMarker.time}</p>
                </div>
                <button onClick={() => setSelectedMarker(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => navigate(`/listing/${selectedMarker.listingId}`)}
                className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-primary font-semibold hover:underline"
              >
                Открыть объявление <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm rounded-xl p-2.5 space-y-1.5 border border-border">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-red-500 border border-white" />
              <span className="text-foreground font-semibold">Потеряно</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-green-500 border border-white" />
              <span className="text-foreground font-semibold">Найдено</span>
            </div>
          </div>
        </div>

        {/* Listings below map */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground">Последние находки и потери</h3>
          {MOCK_LISTINGS.filter(l => l.type === "lost" || l.type === "found").map(l => (
            <div
              key={l.id}
              onClick={() => navigate(`/listing/${l.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-colors"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                l.type === "lost" ? "bg-red-500" : "bg-green-500"
              )}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.location || "Место не указано"} · {l.createdAt}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
