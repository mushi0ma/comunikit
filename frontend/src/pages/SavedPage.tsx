/* comunikit — SavedPage
   Bookmarked listings & threads with tabs
*/
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bookmark, ShoppingBag, MessageSquare, Loader2, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { type Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────── */

interface SavedThread {
  id: string;
  title: string;
  body: string;
  category: string;
  replyCount: number;
  upvotes: number;
  createdAt: string;
  author: { id: string; name: string; avatarUrl?: string | null; karma: number };
  _count?: { comments: number; votes: number };
}

interface SavedData {
  listings: Listing[];
  threads: SavedThread[];
}

/* ── helpers ──────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return dateStr;
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} д`;
}

/* ── page ─────────────────────────────────────────────────── */

export default function SavedPage() {
  const [tab, setTab] = useState<"listings" | "forum">("listings");

  const { data, isLoading } = useQuery<SavedData>({
    queryKey: ["users", "saved"],
    queryFn: () => apiFetch<SavedData>("/api/users/me/saved"),
  });

  const listings = data?.listings ?? [];
  const threads = data?.threads ?? [];

  return (
    <AppLayout title="Сохранённое">
      <div className="container max-w-2xl py-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bookmark className="size-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Сохранённое</h1>
            <p className="text-xs text-muted-foreground">
              {listings.length + threads.length} элементов
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("listings")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border",
              tab === "listings"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <ShoppingBag className="size-3.5" strokeWidth={1.5} />
            Объявления
            <span className="text-xs opacity-60">{listings.length}</span>
          </button>
          <button
            onClick={() => setTab("forum")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border",
              tab === "forum"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <MessageSquare className="size-3.5" strokeWidth={1.5} />
            Форум
            <span className="text-xs opacity-60">{threads.length}</span>
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          </div>
        )}

        {/* Content — Listings */}
        {!isLoading && tab === "listings" && (
          listings.length === 0 ? (
            <EmptyState icon={ShoppingBag} text="Нет сохранённых объявлений" />
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )
        )}

        {/* Content — Forum */}
        {!isLoading && tab === "forum" && (
          threads.length === 0 ? (
            <EmptyState icon={MessageSquare} text="Нет сохранённых тем" />
          ) : (
            <div className="flex flex-col gap-3">
              {threads.map((t) => (
                <Link key={t.id} href={`/forum/${t.id}`} className="block">
                  <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all">
                    <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
                    {t.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.body}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t.author.name}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="size-3" />{t._count?.comments ?? t.replyCount}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" />{timeAgo(t.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}

/* ── Empty state ─────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
