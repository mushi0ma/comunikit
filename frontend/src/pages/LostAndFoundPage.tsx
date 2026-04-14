/* comunikit — Lost & Found (Бюро находок)
   Standalone section for lost/found listings only.
   Based on HomeFeed layout.
*/
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { CATEGORIES } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useListings } from "@/hooks/useListings";

function useLfTabs(t: (key: string) => string) {
  return [
    { label: t("lostFound.all"), value: "all" },
    { label: t("lostFound.lost"), value: "lost" },
    { label: t("lostFound.found"), value: "found" },
  ];
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between mt-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export default function LostAndFoundPage() {
  const { t } = useTranslation();
  const TABS = useLfTabs(t);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { listings, isLoading, error } = useListings();

  useEffect(() => {
    if (error) {
      toast.error(t("feed.loadError"), { description: error.message });
    }
  }, [error]);

  const filtered = useMemo(() => {
    return listings.filter(l => {
      // Only lost/found listings
      if (l.type !== "lost" && l.type !== "found") return false;
      if (activeTab !== "all" && l.type !== activeTab) return false;
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategory !== "all" && l.category !== selectedCategory) return false;
      return true;
    });
  }, [listings, activeTab, search, selectedCategory]);

  return (
    <AppLayout title={t("lostFound.title")}>
      <div className="container py-4 flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("lostFound.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-muted border-border"
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
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3 ck-animate-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{t("feed.filters")}</span>
              <button onClick={() => setSelectedCategory("all")} className="text-xs text-primary hover:underline">
                {t("feed.resetFilters")}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">{t("feed.category")}</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">{t("feed.allCategories")}</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Tabs — underline style */}
        <div className="flex gap-4 overflow-x-auto pb-px scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 pb-2.5 text-sm font-semibold transition-colors duration-150 border-b-2 flex items-center gap-1.5",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? t("common.loading") : t("feed.resultsCount", { count: filtered.length })}
            {!isLoading && activeTab !== "all" && ` · ${TABS.find(tab => tab.value === activeTab)?.label}`}
          </p>
        </div>

        {/* Skeleton grid while loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Listings grid */}
        {!isLoading && (
          filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-bold text-foreground">{t("feed.nothingFound")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("feed.nothingFoundHint")}</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveTab("all"); setSelectedCategory("all"); }}>
                {t("feed.resetAllFilters")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((listing, i) => (
                <div key={listing.id} style={{ animationDelay: `${i * 40}ms` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )
        )}
        </div>
      </div>

      {/* FAB */}
      <Link href="/create">
        <button className="ck-fab md:hidden" aria-label={t("lostFound.reportFab")}>
          <span className="text-2xl font-bold leading-none">+</span>
        </button>
      </Link>
    </AppLayout>
  );
}
