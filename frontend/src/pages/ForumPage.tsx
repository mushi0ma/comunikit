/* comunikit — ForumPage
   Design: RunPod clusters pattern — hero, category feature cards, thread list
   Data: real API + mock fallback
*/
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Pin,
  Plus,
  Clock,
  Hash,
  BookOpen,
  MessageCircle,
  CalendarDays,
  Home as HomeIcon,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import TrendingSection from "@/components/TrendingSection";
import { FORUM_THREADS } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

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

/* ── category definitions ─────────────────────────────────── */

interface ForumCategory {
  value: string;
  label: string;
  Icon: LucideIcon;
  description: string;
}

function useForumCategories(t: (key: string) => string): ForumCategory[] {
  return [
    {
      value: "Учёба",
      label: t("forum.categories.study"),
      Icon: BookOpen,
      description: t("forum.categories.studyDesc"),
    },
    {
      value: "Общее",
      label: t("forum.categories.general"),
      Icon: MessageCircle,
      description: t("forum.categories.generalDesc"),
    },
    {
      value: "События",
      label: t("forum.categories.events"),
      Icon: CalendarDays,
      description: t("forum.categories.eventsDesc"),
    },
    {
      value: "Жильё",
      label: t("forum.categories.housing"),
      Icon: HomeIcon,
      description: t("forum.categories.housingDesc"),
    },
  ];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Учёба": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Общее": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "События": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Жильё": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

/* ── helpers ──────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return dateStr; // fallback for mock "2h ago" style
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} д`;
}

/* Convert mock data to ApiThread-like shape */
function mockToApiThreads(): ApiThread[] {
  return FORUM_THREADS.map(t => ({
    id: t.id,
    title: t.title,
    body: "",
    category: t.category,
    replyCount: t.replies,
    upvotes: 0,
    isPinned: t.pinned ?? false,
    createdAt: t.lastActivity,
    author: { id: "mock", name: t.author.name, avatarUrl: null, karma: 0 },
  }));
}

/* ── VoteButtons component ────────────────────────────────── */

function VoteButtons({ threadId, initialVotes }: { threadId: string; initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);

  async function vote(value: 1 | -1) {
    setLoading(true);
    try {
      await apiFetch(`/api/forum/${threadId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value }),
      });
      // Toggle logic
      if (userVote === value) {
        setVotes(v => v - value);
        setUserVote(null);
      } else {
        setVotes(v => v + value - (userVote || 0));
        setUserVote(value);
      }
    } catch {
      toast.error("Vote error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); vote(1); }}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
          userVote === 1
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <ThumbsUp className="size-3" />
        <span>{votes > 0 ? votes : ""}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); vote(-1); }}
        disabled={loading}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
          userVote === -1
            ? "bg-red-500/20 text-red-400"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <ThumbsDown className="size-3" />
      </button>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default function ForumPage() {
  const { t } = useTranslation();
  const FORUM_CATEGORIES = useForumCategories(t);
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("Общее");
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: threads, isLoading } = useQuery<ApiThread[]>({
    queryKey: ["forum", activeCategory],
    queryFn: async () => {
      const qs = activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : "";
      const data = await apiFetch<ApiThread[]>(`/api/forum${qs}`);
      return data.length > 0 ? data : mockToApiThreads();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; category: string }) =>
      apiFetch<ApiThread>("/api/forum", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum"] });
      setShowCreate(false);
      setNewTitle("");
      setNewBody("");
      toast.success(t("forum.topicCreated"));
    },
    onError: (err: Error) => toast.error(err.message),
  });


  const items = threads ?? mockToApiThreads();
  const filtered = items.filter(
    th => !activeCategory || th.category === activeCategory,
  );

  const categoryCounts = items.reduce<Record<string, number>>((acc, th) => {
    acc[th.category] = (acc[th.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout title={t("nav.forum")}>
      <div className="container py-4 flex gap-6">
      <div className="flex-1 min-w-0 flex flex-col gap-0 max-w-2xl">
        {/* ── Header ───────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <MessageSquare className="size-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{t("forum.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("forum.topicCount", { count: items.length })}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                toast.error(t("forum.loginToCreate"));
                return;
              }
              setShowCreate(v => !v);
            }}
            className="gap-1.5 rounded-xl"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            {t("forum.newTopic")}
          </Button>
        </div>

        {/* ── Category pills ──────────────────────────── */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
              !activeCategory
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Hash className="size-3.5" strokeWidth={1.5} />
            {t("common.all")}
            <span className="text-xs opacity-60">{items.length}</span>
          </button>
          {FORUM_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(isActive ? null : cat.value)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <cat.Icon className="size-3.5" strokeWidth={1.5} />
                {cat.label}
                <span className="text-xs opacity-60">{categoryCounts[cat.value] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* ── Create form ──────────────────────────────── */}
        {showCreate && (
          <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden ck-animate-in">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">{t("forum.newTopic")}</h3>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <Input
                placeholder={t("forum.topicTitle")}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <textarea
                placeholder={t("forum.topicBody")}
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {FORUM_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowCreate(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl"
                  disabled={createMutation.isPending || newTitle.length < 3 || newBody.length < 10}
                  onClick={() => createMutation.mutate({ title: newTitle, body: newBody, category: newCategory })}
                >
                  {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t("common.create")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t("forum.loadingTopics")}</p>
          </div>
        )}

        {/* ── Thread list ──────────────────────────────── */}
        {!isLoading && (
          <div className="flex flex-col gap-3">
            {filtered.map(thread => (
              <div
                key={thread.id}
                onClick={() => navigate(`/forum/${thread.id}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ck-animate-in"
              >
                {/* Author header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <Link
                    href={`/profile/${thread.author.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  >
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
                      <span className="text-sm font-medium text-foreground">
                        {thread.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(thread.createdAt)}
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    {thread.isPinned && (
                      <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        <Pin className="size-3" strokeWidth={1.5} />
                        {t("common.pinned")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[11px] font-medium",
                        CATEGORY_COLORS[thread.category] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {thread.category}
                    </span>
                  </div>
                </div>

                {/* Title & body preview */}
                <div className="px-4 pb-3">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {thread.title}
                  </h3>
                  {thread.body && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {thread.body}
                    </p>
                  )}
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between border-t border-border px-2 py-2">
                  <div className="flex items-center">
                    <VoteButtons threadId={thread.id} initialVotes={thread.upvotes || 0} />
                    <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                      <MessageSquare className="size-3.5" strokeWidth={1.5} />
                      <span>{thread.replyCount}</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" strokeWidth={1.5} />
                    {timeAgo(thread.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted border border-border mb-5">
              <MessageSquare className="size-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">{t("forum.noTopics")}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {activeCategory ? t("forum.noTopicsInCategory", { category: activeCategory }) : t("forum.beFirst")}
            </p>
            <Button
              className="rounded-xl gap-1.5"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error(t("forum.loginToCreate"));
                  return;
                }
                setShowCreate(true);
              }}
            >
              <Plus className="size-4" strokeWidth={1.5} />
              {t("forum.createFirst")}
            </Button>
          </div>
        )}
      </div>

      {/* Side section — desktop only */}
      <aside className="hidden xl:block w-80 shrink-0">
        <TrendingSection />
      </aside>
      </div>
    </AppLayout>
  );
}
