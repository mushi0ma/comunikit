/* comunikit — MapPage (AITU Campus Interactive Map)
   Карта этажей корпуса C1 с Lost & Found маркерами
*/
import { useState } from "react";
import { ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import AituMap, { type MapMarker } from "@/features/map/AituMap";
import type { PendingMarker } from "@/features/map/AituMapContext";

// ── Types ──────────────────────────────────────────────────────────────────
type FilterValue = "all" | "lost" | "found";

interface MarkerWithMeta extends MapMarker {
  location: string;
  time: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_MARKERS: MarkerWithMeta[] = [
  {
    roomId: "LIBRARY|BIBLIOTEKA|БИБЛИОТЕКА|МЕДИАТЕКА|MEDIATEKA|KITAPHANA|КІТАПХАНА",
    type: "lost",
    listingId: "2",
    title: "Потерян AirPods Pro",
    location: "Библиотека / Медиатека",
    time: "5ч назад",
  },
  {
    roomId: "C1.1.168",
    type: "found",
    listingId: "3",
    title: "Найдено студ. удостоверение",
    location: "Аудитория C1.1.168",
    time: "1д назад",
  },
  {
    roomId: "C1.1.165",
    type: "lost",
    listingId: "8",
    title: "Потерян Samsung Galaxy S23",
    location: "Аудитория C1.1.165",
    time: "30м назад",
  },
  {
    roomId: "ASSEMBLYHALL|АКТОВЫЙ ЗАЛ",
    type: "found",
    listingId: "3",
    title: "Найдены ключи",
    location: "Актовый зал",
    time: "2д назад",
  },
];

const FLOORS = [1, 2, 3] as const;
const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "lost", label: "Потеряно" },
  { value: "found", label: "Найдено" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function MapPage() {
  const [, navigate] = useLocation();
  const [activeFloor, setActiveFloor] = useState<(typeof FLOORS)[number]>(1);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [activeMarker, setActiveMarker] = useState<MarkerWithMeta | null>(null);
  const [pendingMarker, setPendingMarker] = useState<PendingMarker | null>(null);
  const [pickerPoint, setPickerPoint] = useState<{ x: number; y: number } | null>(null);

  const floorKey = `all-${activeFloor}`;

  const visibleMarkers = MOCK_MARKERS.filter(
    (m) => filter === "all" || m.type === filter
  );

  function handleRoomClick(roomId: string) {
    const marker = visibleMarkers.find((m) => m.roomId === roomId);
    if (marker) {
      setActiveMarker((prev) => (prev?.roomId === roomId ? null : marker));
    }
  }

  function handleMapClick(point: { x: number; y: number }) {
    setActiveMarker(null);
    setPickerPoint(point);
  }

  function confirmPending(type: "lost" | "found") {
    if (!pickerPoint) return;
    setPendingMarker({ x: pickerPoint.x, y: pickerPoint.y, type });
    setPickerPoint(null);
  }

  function cancelPicker() {
    setPickerPoint(null);
  }

  function cancelPending() {
    setPendingMarker(null);
  }

  return (
    <AppLayout title="Карта кампуса">
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-lg font-black text-foreground"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              Lost & Found карта
            </h2>
            <p className="text-sm text-muted-foreground">
              Корпус C1 · {MOCK_MARKERS.length} меток
            </p>
          </div>
          <Button onClick={() => navigate("/create")} className="gap-2 text-sm">
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {f.value === "lost" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 align-middle" />
              )}
              {f.value === "found" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 align-middle" />
              )}
              {f.label}
            </button>
          ))}
        </div>

        {/* Map with vertical floor switcher (right side, like aitumap) */}
        <div className="relative" style={{ height: "calc(100vh - 200px)" }}>
          <AituMap
            floor={floorKey}
            markers={visibleMarkers}
            onRoomClick={handleRoomClick}
            onMapClick={handleMapClick}
            className="w-full h-full"
          >
            {pendingMarker && (
              <div
                style={{
                  left: `${pendingMarker.x}%`,
                  top: `${pendingMarker.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 border-white",
                    pendingMarker.type === "lost"
                      ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                      : "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                  )}
                />
              </div>
            )}
            {pickerPoint && (
              <div
                style={{ left: `${pickerPoint.x}%`, top: `${pickerPoint.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              >
                <div className="w-3 h-3 rounded-full bg-primary/70 border-2 border-white animate-pulse" />
              </div>
            )}
          </AituMap>

          {/* Vertical floor switcher */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-md z-10"
            role="tablist"
            aria-label="Переключатель этажей"
          >
            {FLOORS.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={activeFloor === f}
                onClick={() => setActiveFloor(f)}
                className={cn(
                  "w-9 h-9 rounded-md text-sm font-bold transition-colors",
                  activeFloor === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={`Этаж ${f}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Popup */}
          {activeMarker && (
            <div className="fixed bottom-20 left-4 right-4 lg:absolute lg:bottom-4 lg:left-4 lg:right-20 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 z-10 ck-animate-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5",
                      activeMarker.type === "lost"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-green-500/15 text-green-400"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        activeMarker.type === "lost"
                          ? "bg-red-400"
                          : "bg-green-400"
                      )}
                    />
                    {activeMarker.type === "lost" ? "ПОТЕРЯНО" : "НАЙДЕНО"}
                  </span>
                  <p className="text-sm font-bold text-foreground leading-snug truncate">
                    {activeMarker.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeMarker.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeMarker.time}
                  </p>
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

          {/* Bottom sheet: pick marker type */}
          {pickerPoint && (
            <div className="fixed bottom-20 left-4 right-4 lg:absolute lg:bottom-4 lg:left-4 lg:right-20 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 z-30 ck-animate-in">
              <p className="text-sm font-bold text-foreground mb-3">
                Отметить место потери?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmPending("lost")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Потеряно
                </button>
                <button
                  onClick={() => confirmPending("found")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-green-500/15 text-green-400 border border-green-400/30 hover:bg-green-500/25 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Найдено
                </button>
                <button
                  onClick={cancelPicker}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground border border-border hover:bg-muted transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Pending marker actions */}
          {pendingMarker && !pickerPoint && (
            <div className="fixed bottom-20 left-4 right-4 lg:absolute lg:bottom-4 lg:left-4 lg:right-20 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 z-20 ck-animate-in">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      pendingMarker.type === "lost"
                        ? "bg-red-400"
                        : "bg-green-400"
                    )}
                  />
                  <p className="text-sm font-bold text-foreground truncate">
                    {pendingMarker.type === "lost"
                      ? "Место потери отмечено"
                      : "Место находки отмечено"}
                  </p>
                </div>
                <button
                  onClick={cancelPending}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Убрать метку"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("mapX", String(pendingMarker.x));
                  params.set("mapY", String(pendingMarker.y));
                  params.set("type", pendingMarker.type);
                  params.set("floor", String(activeFloor));
                  navigate(`/create?${params.toString()}`);
                }}
                className="w-full text-sm"
              >
                Добавить объявление
              </Button>
            </div>
          )}
        </div>

        {/* Credit */}
        <p className="text-xs text-muted-foreground">
          Карта:{" "}
          <span className="font-mono">github.com/Yuujiso/aitumap</span>
        </p>
      </div>
    </AppLayout>
  );
}
