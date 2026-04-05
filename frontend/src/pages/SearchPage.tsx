/* comunikit — SearchPage (global search across listings + forum)
   Client-side search over mock data for now.
*/
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Clock, MessageSquare, Package } from "lucide-react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import {
  MOCK_LISTINGS,
  FORUM_THREADS,
  getTypeLabel,
  getTypeColor,
} from "@/lib/mockData";

const RECENT_KEY = "comunikit.recent-searches";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(items: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return { listings: [], threads: [] };
    const q = query.toLowerCase();
    return {
      listings: MOCK_LISTINGS.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      ),
      threads: FORUM_THREADS.filter((t) => t.title.toLowerCase().includes(q)),
    };
  }, [query]);

  const hasQuery = query.trim().length >= 2;
  const hasResults = results.listings.length > 0 || results.threads.length > 0;

  function commitRecent(value: string) {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...recent.filter((r) => r !== v)].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    commitRecent(query);
  }

  function clearRecent() {
    setRecent([]);
    saveRecent([]);
  }

  function openListing(id: string) {
    commitRecent(query);
    navigate(`/listing/${id}`);
  }

  function openForum() {
    commitRecent(query);
    navigate("/forum");
  }

  return (
    <AppLayout title="Поиск">
      <div className="px-4 py-4 flex flex-col gap-4 max-w-3xl mx-auto w-full">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Искать объявления, темы форума…"
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Очистить"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Recent searches — only when no active query */}
        {!hasQuery && recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Недавние
              </h3>
              <button
                onClick={clearRecent}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Очистить
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              {recent.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => setQuery(r)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="truncate">{r}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty placeholder */}
        {!hasQuery && recent.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Начните вводить запрос…</p>
            <p className="text-xs mt-1 opacity-70">
              Объявления, темы форума и многое другое
            </p>
          </div>
        )}

        {/* No results */}
        {hasQuery && !hasResults && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Ничего не найдено по запросу «{query}»</p>
          </div>
        )}

        {/* Results: listings */}
        {hasQuery && results.listings.length > 0 && (
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              <Package className="w-3.5 h-3.5" />
              Объявления · {results.listings.length}
            </h3>
            <ul className="flex flex-col gap-2">
              {results.listings.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => openListing(l.id)}
                    className="flex items-start gap-3 w-full p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                  >
                    {l.images[0] ? (
                      <img
                        src={l.images[0]}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            getTypeColor(l.type)
                          )}
                        >
                          {getTypeLabel(l.type)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {l.category}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {l.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {l.description}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Results: forum threads */}
        {hasQuery && results.threads.length > 0 && (
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Форум · {results.threads.length}
            </h3>
            <ul className="flex flex-col gap-2">
              {results.threads.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={openForum}
                    className="flex flex-col w-full p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {t.replies} ответов · {t.lastActivity}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.title}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
