/* comunikit — LikedPage
   Liked listings & threads with tabs
*/
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, MessageSquare, Clock, Pin, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { type Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── types ─────────────────────────────────────────────────── */

interface ApiThread {
  id: string;
  title: string;
  body: string;
  category: string;
  replyCount: number;
  upvotes: number;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; name: string; avatarUrl?: string | null; karma: number };
  _count?: { comments: number; votes: number };
}

interface LikedData {
  listings: Listing[];
  threads: ApiThread[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Учёба": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Общее": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "События": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Жильё": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

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

export default function LikedPage() {
  const [, navigate] = useLocation();

  const { data, isLoading } = useQuery<LikedData>({
    queryKey: ["users", "liked"],
    queryFn: () => apiFetch<LikedData>("/api/users/me/liked"),
  });

  const listings = data?.listings ?? [];
  const threads = data?.threads ?? [];

  return (
    <AppLayout title="Понравилось">
      <div className="container max-w-2xl py-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
            <Heart className="size-4 text-red-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Понравилось</h1>
            <p className="text-xs text-muted-foreground">
              {listings.length + threads.length} элементов
            </p>
          </div>
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

        {/* Content */}
        {!isLoading && (
          <Tabs defaultValue="listings">
            <TabsList className="w-full">
              <TabsTrigger value="listings" className="gap-1.5">
                <ShoppingBag className="size-3.5" />
                Объявления
                {listings.length > 0 && (
                  <span className="text-xs opacity-60">{listings.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="threads" className="gap-1.5">
                <MessageSquare className="size-3.5" />
                Форум
                {threads.length > 0 && (
                  <span className="text-xs opacity-60">{threads.length}</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="mt-4">
              {listings.length === 0 ? (
                <EmptyState icon={ShoppingBag} text="Нет понравившихся объявлений" />
              ) : (
                <div className="flex flex-col gap-3">
                  {listings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="threads" className="mt-4">
              {threads.length === 0 ? (
                <EmptyState icon={MessageSquare} text="Нет понравившихся тем" />
              ) : (
                <div className="flex flex-col gap-3">
                  {threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onClick={() => navigate(`/forum/${thread.id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

/* ── ThreadCard (reused from ForumPage pattern) ──────────── */

function ThreadCard({
  thread,
  onClick,
}: {
  thread: ApiThread;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ck-animate-in"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          {thread.author.avatarUrl ? (
            <img
              src={thread.author.avatarUrl}
              alt={thread.author.name}
              className="size-8 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
              {thread.author.name[0]}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{thread.author.name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(thread.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {thread.isPinned && (
            <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Pin className="size-3" strokeWidth={1.5} />
              Закреп
            </span>
          )}
          <span
            className={cn(
              "rounded-lg px-2 py-0.5 text-[11px] font-medium",
              CATEGORY_COLORS[thread.category] ?? "bg-muted text-muted-foreground",
            )}
          >
            {thread.category}
          </span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          {thread.title}
        </h3>
        {thread.body && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{thread.body}</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" strokeWidth={1.5} />
          {thread.replyCount} ответов
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" strokeWidth={1.5} />
          {timeAgo(thread.createdAt)}
        </span>
      </div>
    </div>
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
