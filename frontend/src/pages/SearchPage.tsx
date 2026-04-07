import { useState, useEffect } from "react";
import { Search, Loader2, MessageSquare, ShoppingBag, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"listings" | "forum">("listings");
  const [listings, setListings] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setListings([]);
      setThreads([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [lRes, fRes] = await Promise.all([
          apiFetch<any>(`/api/listings/search?q=${encodeURIComponent(query)}`),
          apiFetch<any>(`/api/forum/search?q=${encodeURIComponent(query)}`),
        ]);
        setListings(Array.isArray(lRes) ? lRes : lRes.data || []);
        setThreads(Array.isArray(fRes) ? fRes : fRes.data || []);
      } catch {
        /* silent */
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <AppLayout title="Поиск">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск объявлений и тем форума..."
            className="pl-10 pr-10 h-12 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {[
            { key: "listings" as const, label: "Объявления", icon: ShoppingBag, count: listings.length },
            { key: "forum" as const, label: "Форум", icon: MessageSquare, count: threads.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {query.length >= 2 && (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && query.length >= 2 && tab === "listings" && listings.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Ничего не найдено по запросу «{query}»
          </p>
        )}
        {!loading && query.length >= 2 && tab === "forum" && threads.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Нет тем по запросу «{query}»
          </p>
        )}

        {/* Listings results */}
        {!loading && tab === "listings" && (
          <div className="grid gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        {/* Forum results */}
        {!loading && tab === "forum" && (
          <div className="flex flex-col gap-3">
            {threads.map((t) => (
              <Link key={t.id} href={`/forum/${t.id}`}>
                <div className="rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <p className="font-semibold text-sm mb-1">{t.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{t.author?.name}</span>
                    <span>·</span>
                    <span className="text-primary">{t.category}</span>
                    <span>·</span>
                    <span>{t.replyCount ?? 0} ответов</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Hint when empty query */}
        {query.length < 2 && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Начни вводить запрос</p>
            <p className="text-sm mt-1">Поиск по объявлениям и темам форума</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
