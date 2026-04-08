/* comunikit — ForumThreadPage
   Thread detail view: title, body, author, votes, comments list, add-comment form.
*/
import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MessageSquare,
  Pin,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

/* ── types ─────────────────────────────────────────────────── */

interface ThreadAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  karma: number;
}

interface ThreadComment {
  id: string;
  body: string;
  createdAt: string;
  author: ThreadAuthor;
}

interface ThreadDetail {
  id: string;
  title: string;
  body: string;
  category: string;
  replyCount: number;
  upvotes: number;
  isPinned: boolean;
  createdAt: string;
  author: ThreadAuthor;
  comments: ThreadComment[];
}

/* ── category badge colors (same as ForumPage) ───────────── */

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
  if (isNaN(d)) return dateStr;
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} д назад`;
}

/* ── VoteButtons ─────────────────────────────────────────── */

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
      if (userVote === value) {
        setVotes(v => v - value);
        setUserVote(null);
      } else {
        setVotes(v => v + value - (userVote || 0));
        setUserVote(value);
      }
    } catch {
      toast.error("Ошибка голосования");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
          userVote === 1
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <ThumbsUp className="size-4" />
        <span>{votes > 0 ? votes : ""}</span>
      </button>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
          userVote === -1
            ? "bg-red-500/20 text-red-400"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        <ThumbsDown className="size-4" />
      </button>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default function ForumThreadPage() {
  const [, params] = useRoute("/forum/:id");
  const threadId = params?.id ?? "";
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");

  const { data: thread, isLoading, isError } = useQuery<ThreadDetail>({
    queryKey: ["forum", threadId],
    queryFn: () => apiFetch<ThreadDetail>(`/api/forum/${threadId}`),
    enabled: !!threadId,
  });

  const addComment = useMutation({
    mutationFn: (body: string) =>
      apiFetch<ThreadComment>("/api/comments", {
        method: "POST",
        body: JSON.stringify({ body, threadId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
      setCommentBody("");
      toast.success("Комментарий добавлен");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  /* ── loading skeleton ──────────────────────────────────── */
  if (isLoading) {
    return (
      <AppLayout title="Загрузка...">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all mb-6">
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Назад к форуму
          </Link>
          <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-border flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted" />
              <div className="flex flex-col gap-2">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-20 w-full rounded-xl bg-muted" />
            </div>
            <div className="px-6 py-3 border-t border-border flex gap-3">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  /* ── error state ───────────────────────────────────────── */
  if (isError || !thread) {
    return (
      <AppLayout title="Ошибка">
        <div className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 mb-5">
            <AlertCircle className="size-7 text-destructive" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-medium text-foreground">Тема не найдена</h2>
          <p className="mt-1 text-sm text-muted-foreground">Возможно, она была удалена.</p>
          <Link href="/forum">
            <Button variant="outline" className="mt-6 gap-1.5 rounded-xl">
              <ArrowLeft className="size-4" strokeWidth={1.5} />
              Назад к форуму
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={thread.title}>
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* ── Back link ────────────────────────────────────── */}
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all mb-6">
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Назад к форуму
        </Link>

        {/* ── Thread card ──────────────────────────────────── */}
        <article className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Author header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Link href={`/profile/${thread.author.id}`}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                {thread.author.avatarUrl ? (
                  <img
                    src={thread.author.avatarUrl}
                    alt={thread.author.name}
                    className="size-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
                    {thread.author.name[0]}
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-foreground">{thread.author.name}</span>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3" strokeWidth={1.5} />
                    {timeAgo(thread.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
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

          {/* Title & Body */}
          <div className="px-6 py-5">
            <h1 className="text-xl font-semibold text-foreground">{thread.title}</h1>
            {thread.body && (
              <div className="mt-3 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {thread.body}
              </div>
            )}
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="flex items-center">
              <VoteButtons threadId={thread.id} initialVotes={thread.upvotes} />
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" strokeWidth={1.5} />
                {thread.comments.length} комментариев
              </span>
            </div>
          </div>
        </article>

        {/* ── Comments section ─────────────────────────────── */}
        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
              <MessageSquare className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-medium text-foreground">
              Комментарии ({thread.comments.length})
            </h2>
          </div>

          {thread.comments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
                <MessageSquare className="size-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-foreground">Пока нет комментариев</p>
              <p className="mt-1 text-xs text-muted-foreground">Будьте первым!</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {thread.comments.map(comment => (
              <div
                key={comment.id}
                className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-border"
              >
                {/* Comment author header */}
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
                  <Link href={`/profile/${comment.author.id}`}>
                    <div className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                      {comment.author.avatarUrl ? (
                        <img
                          src={comment.author.avatarUrl}
                          alt={comment.author.name}
                          className="size-7 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                          {comment.author.name[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {comment.author.name}
                      </span>
                    </div>
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    · {timeAgo(comment.createdAt)}
                  </span>
                </div>
                {/* Comment body */}
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Add comment form ─────────────────────────────── */}
        {isAuthenticated && (
          <form
            className="mt-6 rounded-2xl border border-border bg-card overflow-hidden"
            onSubmit={e => {
              e.preventDefault();
              if (commentBody.trim().length < 2) return;
              addComment.mutate(commentBody.trim());
            }}
          >
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium text-foreground">Написать комментарий</h3>
            </div>
            <div className="p-4">
              <textarea
                placeholder="Ваш комментарий..."
                value={commentBody}
                onChange={e => setCommentBody(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none"
                disabled={addComment.isPending}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={addComment.isPending || commentBody.trim().length < 2}
                  className="gap-1.5 rounded-xl"
                >
                  {addComment.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="size-4" strokeWidth={1.5} />
                      Отправить
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
