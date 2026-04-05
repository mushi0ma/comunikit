/* comunikit — ForumPage
   Design: RunPod clusters pattern — hero, category feature cards, thread list
   Data: real API + mock fallback
*/
import { useState } from "react";
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
  ArrowBigUp,
  ArrowBigDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
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

const FORUM_CATEGORIES: ForumCategory[] = [
  {
    value: "Учёба",
    label: "Учёба",
    Icon: BookOpen,
    description: "Экзамены, курсы, преподаватели и полезные ресурсы",
  },
  {
    value: "Общее",
    label: "Общее",
    Icon: MessageCircle,
    description: "Жизнь в кампусе, вопросы, советы и обсуждения",
  },
  {
    value: "События",
    label: "События",
    Icon: CalendarDays,
    description: "Хакатоны, конференции, meetup-ы и мероприятия",
  },
  {
    value: "Жильё",
    label: "Жильё",
    Icon: HomeIcon,
    description: "Поиск соседей, аренда и вопросы по общежитиям",
  },
];

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

/* ── page ─────────────────────────────────────────────────── */

export default function ForumPage() {
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
      toast.success("Тема создана!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const voteMutation = useMutation({
    mutationFn: async ({ threadId, value }: { threadId: string; value: number }) =>
      apiFetch<{ action: string; value: number }>(`/api/forum/${threadId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const items = threads ?? mockToApiThreads();
  const filtered = items.filter(
    t => !activeCategory || t.category === activeCategory,
  );

  const categoryCounts = items.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout title="Форум">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Форум AITUC
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} тем · студенческое сообщество
          </p>
        </div>

        {/* ── Category feature cards ───────────────────── */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FORUM_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value;
            return (
              <div
                key={cat.value}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.value)
                }
                className={cn(
                  "cursor-pointer rounded-xl border p-6 transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-accent/50",
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <cat.Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {cat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoryCounts[cat.value] || 0} тем
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Section header + CTA ─────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {activeCategory ?? "Все темы"}
          </h2>
          <Button
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Войдите, чтобы создать тему");
                return;
              }
              setShowCreate(v => !v);
            }}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Новая тема
          </Button>
        </div>

        {/* ── Create form ──────────────────────────────── */}
        {showCreate && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 space-y-3 ck-animate-in">
            <Input
              placeholder="Заголовок темы..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <textarea
              placeholder="Текст (мин. 10 символов)..."
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none"
            />
            <div className="flex items-center gap-2">
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {FORUM_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                disabled={createMutation.isPending || newTitle.length < 3 || newBody.length < 10}
                onClick={() => createMutation.mutate({ title: newTitle, body: newBody, category: newCategory })}
              >
                {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Создать"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ── Thread list ──────────────────────────────── */}
        {!isLoading && (
          <div className="flex flex-col gap-3">
            {filtered.map(thread => (
              <div
                key={thread.id}
                className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50 ck-animate-in"
              >
                {/* title row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {thread.isPinned && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-primary">
                          <Pin className="size-3" />
                          Закреплено
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          CATEGORY_COLORS[thread.category] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {thread.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                      {thread.title}
                    </h3>
                  </div>

                  {/* Vote buttons */}
                  <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); voteMutation.mutate({ threadId: thread.id, value: 1 }); }}
                      className="rounded p-0.5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowBigUp className="size-4" />
                    </button>
                    <span className="text-xs font-semibold text-foreground">{thread.upvotes}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); voteMutation.mutate({ threadId: thread.id, value: -1 }); }}
                      className="rounded p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <ArrowBigDown className="size-4" />
                    </button>
                  </div>
                </div>

                {/* meta row */}
                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                      {thread.author.name[0]}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {thread.author.name}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="size-3.5" />
                    {thread.replyCount}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {timeAgo(thread.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 size-12 opacity-30" />
            <p className="font-semibold">Нет тем в этой категории</p>
            <Button
              className="mt-4"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Войдите, чтобы создать тему");
                  return;
                }
                setShowCreate(true);
              }}
            >
              Создать первую тему
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
