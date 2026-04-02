/* comunikit — MapPage (Lost & Found Interactive Map)
   Design: "Digital Bazaar" — campus SVG map with red/green markers
*/
import { useState } from "react";
import { MapPin, Plus, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { FloorPlanMap } from "@/components/Map";
import { MOCK_LISTINGS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

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
            <h2 className="text-lg font-black text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
              План корпуса C1
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

        {/* Floor plan map */}
        <FloorPlanMap building="C1" />

        {/* Filter toggles */}
        <div className="flex gap-2 pt-2">
          <p className="text-sm font-semibold text-foreground self-center mr-1">Метки:</p>
          {([
            { value: "all", label: "Все" },
            { value: "lost", label: "🔴 Потеряно" },
            { value: "found", label: "🟢 Найдено" },
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
