/* comunikit — HomeFeed
   Design: "Digital Bazaar" — 2-col grid (mobile), 3-col (desktop), tabs, filters, FAB
*/
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { MOCK_LISTINGS, CATEGORIES, ListingType } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABS: { label: string; value: string; emoji?: string }[] = [
  { label: "Все", value: "all" },
  { label: "Продажа", value: "sell" },
  { label: "Покупка", value: "buy" },
  { label: "Услуги", value: "service" },
  { label: "Потеряно", value: "lost", emoji: "🔴" },
  { label: "Найдено", value: "found", emoji: "🟢" },
];

export default function HomeFeed() {
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMax, setPriceMax] = useState("");

  const filtered = useMemo(() => {
    return MOCK_LISTINGS.filter(l => {
      if (activeTab !== "all" && l.type !== activeTab) return false;
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== "all" && l.category !== selectedCategory) return false;
      if (priceMax && l.price && l.price > Number(priceMax)) return false;
      return true;
    });
  }, [activeTab, search, selectedCategory, priceMax]);

  return (
    <AppLayout title="Лента объявлений">
      <div className="container py-4 space-y-4">
        {/* Hero banner (mobile) */}
        <div
          className="md:hidden rounded-2xl overflow-hidden relative h-28"
          style={{
            background: "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-hero-banner-85VqLVpBhkiWK658xP953V.webp) center/cover no-repeat"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/70 to-transparent" />
          <div className="relative z-10 p-4 h-full flex flex-col justify-center">
            <p className="text-white font-black text-lg leading-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Студенческий базар AITUC
            </p>
            <p className="text-white/80 text-xs mt-0.5">500+ объявлений · только для своих</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск объявлений..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("shrink-0", showFilters ? "bg-primary/10 border-primary text-primary" : "")}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setView(v => v === "grid" ? "list" : "grid")}
            className="shrink-0"
          >
            {view === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 ck-animate-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Фильтры</span>
              <button onClick={() => { setSelectedCategory("all"); setPriceMax(""); }} className="text-xs text-primary hover:underline">
                Сбросить
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Категория</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Все категории</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Макс. цена (₸)</label>
                <Input
                  type="number"
                  placeholder="Без ограничений"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150",
                activeTab === tab.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} объявлений
            {activeTab !== "all" && ` · ${TABS.find(t => t.value === activeTab)?.label}`}
          </p>
        </div>

        {/* Listings grid/list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-empty-state-c4ABgXauiyYkmsN9H2jibK.webp"
              alt="Ничего не найдено"
              className="w-32 h-32 object-contain mb-4 opacity-60"
            />
            <p className="text-lg font-bold text-foreground">Ничего не найдено</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveTab("all"); setSelectedCategory("all"); }}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-2 lg:grid-cols-3 gap-3"
              : "flex flex-col gap-3"
          )}>
            {filtered.map((listing, i) => (
              <div key={listing.id} style={{ animationDelay: `${i * 40}ms` }}>
                <ListingCard listing={listing} view={view} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/create">
        <button className="ck-fab md:hidden" aria-label="Добавить объявление">
          <span className="text-2xl font-bold leading-none">+</span>
        </button>
      </Link>
    </AppLayout>
  );
}
