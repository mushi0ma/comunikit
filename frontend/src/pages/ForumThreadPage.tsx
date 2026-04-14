/* comunikit — ForumThreadPage
   Thread detail view: title, body, author, votes, comments list, add-comment form.
*/
import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Pin,
  Reply,
  Send,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

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
  parentId?: string | null;
  author: ThreadAuthor;
  replies?: ThreadComment[];
  _count?: { votes: number; replies: number };
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

interface VoteResponse {
  action: "created" | "updated" | "removed";
  value: number;
}

interface VoteContext {
  prevVotes: number;
  prevUserVote: 1 | -1 | null;
}

function VoteButtons({ threadId, initialVotes }: { threadId: string; initialVotes: number }) {
  const queryClient = useQueryClient();
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);

  const voteMutation = useMutation<VoteResponse, Error, 1 | -1, VoteContext>({
    mutationFn: (value) =>
      apiFetch<VoteResponse>(`/api/forum/${threadId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value }),
      }),
    onMutate: async (value) => {
      // Cancel in-flight thread refetches so they don't clobber the
      // optimistic update before the server responds.
      await queryClient.cancelQueries({ queryKey: ["forum", threadId] });

      // Snapshot so onError can restore on failure.
      const ctx: VoteContext = { prevVotes: votes, prevUserVote: userVote };

      // Optimistic update — mirror backend semantics (toggle/switch).
      if (userVote === value) {
        setVotes((v) => v - value);
        setUserVote(null);
      } else {
        setVotes((v) => v + value - (userVote ?? 0));
        setUserVote(value);
      }

      return ctx;
    },
    onError: (_err, _value, ctx) => {
      // Roll back to the snapshot captured in onMutate. The previous
      // version passed the wrong context shape here, so the rollback
      // silently no-op'd and the UI drifted away from the server state.
      if (ctx) {
        setVotes(ctx.prevVotes);
        setUserVote(ctx.prevUserVote);
      }
      toast.error("Ошибка голосования");
    },
    onSettled: () => {
      // Refresh the thread (and its upvote count) after the server has
      // authoritatively accepted or rejected the vote.
      void queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
    },
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => voteMutation.mutate(1)}
        disabled={voteMutation.isPending}
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
        onClick={() => voteMutation.mutate(-1)}
        disabled={voteMutation.isPending}
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

/* ── CommentVote ─────────────────────────────────────────── */

interface CommentVoteContext {
  prevVotes: number;
  prevVoted: boolean;
}

function CommentVote({
  commentId,
  initialVotes,
  threadId,
}: {
  commentId: string;
  initialVotes: number;
  threadId: string;
}) {
  const queryClient = useQueryClient();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);

  const voteMutation = useMutation<VoteResponse, Error, void, CommentVoteContext>({
    mutationFn: () =>
      apiFetch<VoteResponse>(`/api/comments/${commentId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value: voted ? -1 : 1 }),
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["forum", threadId] });
      const ctx: CommentVoteContext = { prevVotes: votes, prevVoted: voted };
      // Optimistic toggle
      setVoted(!voted);
      setVotes((v) => (voted ? v - 1 : v + 1));
      return ctx;
    },
    onError: (_err, _void, ctx) => {
      if (ctx) {
        setVoted(ctx.prevVoted);
        setVotes(ctx.prevVotes);
      }
      toast.error("Ошибка голосования");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
    },
  });

  return (
    <button
      onClick={() => voteMutation.mutate()}
      disabled={voteMutation.isPending}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
        voted
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      <ThumbsUp className="size-3" />
      <span>{votes > 0 ? votes : ""}</span>
    </button>
  );
}

/* ── CommentItem (recursive) ─────────────────────────────── */

function CommentItem({
  comment,
  threadId,
  depth = 0,
  onReplyAdded,
}: {
  comment: ThreadComment;
  threadId: string;
  depth?: number;
  onReplyAdded: () => void;
}) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const currentUser = useAuthStore(s => s.user);
  const isCommentOwner = !!(currentUser?.id && comment.author.id === currentUser.id);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const [editingComment, setEditingComment] = useState(false);
  const [editCommentBody, setEditCommentBody] = useState("");
  const [showCommentDeleteDialog, setShowCommentDeleteDialog] = useState(false);

  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      apiFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({ body, threadId, parentId: comment.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
      setReplyBody("");
      setShowReplyForm(false);
      toast.success("Ответ добавлен");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка отправки"),
  });

  const editCommentMutation = useMutation({
    mutationFn: (body: string) =>
      apiFetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
      setEditingComment(false);
      toast.success("Комментарий обновлён");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: () => apiFetch(`/api/comments/${comment.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
      toast.success("Комментарий удалён");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка"),
  });

  const submitting = replyMutation.isPending;

  function handleReply() {
    if (!replyBody.trim()) return;
    replyMutation.mutate(replyBody.trim());
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-border/80">
        {/* Author header */}
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

        {/* Body */}
        <div className="px-4 py-3">
          {editingComment ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editCommentBody}
                onChange={e => setEditCommentBody(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setEditingComment(false)}>
                  Отмена
                </Button>
                <Button
                  size="sm"
                  className="gap-1 rounded-xl text-xs"
                  disabled={editCommentMutation.isPending || editCommentBody.trim().length < 1}
                  onClick={() => editCommentMutation.mutate(editCommentBody.trim())}
                >
                  {editCommentMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {comment.body}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-4 pb-3">
          <CommentVote
            commentId={comment.id}
            initialVotes={comment._count?.votes ?? 0}
            threadId={threadId}
          />

          {isAuthenticated && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                showReplyForm
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Reply className="size-3" />
              Ответить
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {comment.replies!.length}
            </button>
          )}

          {isCommentOwner && !editingComment && (
            <>
              <button
                onClick={() => { setEditCommentBody(comment.body); setEditingComment(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => setShowCommentDeleteDialog(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </>
          )}
        </div>

        <ConfirmDeleteDialog
          open={showCommentDeleteDialog}
          onOpenChange={setShowCommentDeleteDialog}
          onConfirm={() => deleteCommentMutation.mutate()}
          title="Удалить комментарий?"
          description="Комментарий будет скрыт. Это действие нельзя отменить."
          isPending={deleteCommentMutation.isPending}
        />

        {/* Inline reply form */}
        {showReplyForm && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <textarea
              placeholder={`Ответить ${comment.author.name}...`}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none"
              disabled={submitting}
            />
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => { setShowReplyForm(false); setReplyBody(""); }}
              >
                Отмена
              </Button>
              <Button
                size="sm"
                disabled={submitting || replyBody.trim().length < 2}
                className="gap-1.5 rounded-xl text-xs"
                onClick={handleReply}
              >
                {submitting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" strokeWidth={1.5} />}
                Ответить
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="ml-6 pl-4 border-l-2 border-border mt-2 flex flex-col gap-2">
          {comment.replies!.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              threadId={threadId}
              depth={depth + 1}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default function ForumThreadPage() {
  const [, params] = useRoute("/forum/:id");
  const [, navigate] = useLocation();
  const threadId = params?.id ?? "";
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const { data: thread, isLoading, isError } = useQuery<ThreadDetail>({
    queryKey: ["forum", threadId],
    queryFn: () => apiFetch<ThreadDetail>(`/api/forum/${threadId}`),
    enabled: !!threadId,
  });

  const isOwner = !!(user?.id && thread?.author?.id === user.id);

  const editMutation = useMutation({
    mutationFn: (data: { title?: string; body?: string }) =>
      apiFetch(`/api/forum/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", threadId] });
      setEditing(false);
      toast.success("Тема обновлена");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка сохранения"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/api/forum/${threadId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Тема удалена");
      navigate("/forum");
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка удаления"),
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
            {editing ? (
              <div className="flex flex-col gap-3">
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    onClick={() => setEditing(false)}
                  >
                    <X className="size-3.5" />
                    Отмена
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-xl"
                    disabled={editMutation.isPending || editTitle.trim().length < 3 || editBody.trim().length < 10}
                    onClick={() => editMutation.mutate({ title: editTitle.trim(), body: editBody.trim() })}
                  >
                    {editMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Сохранить
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-foreground">{thread.title}</h1>
                {thread.body && (
                  <div className="mt-3 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {thread.body}
                  </div>
                )}
              </>
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
            {isOwner && !editing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditTitle(thread.title); setEditBody(thread.body); setEditing(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="size-3" />
                  Изменить
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-3" />
                  Удалить
                </button>
              </div>
            )}
          </div>

          <ConfirmDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            onConfirm={() => deleteMutation.mutate()}
            title="Удалить тему?"
            description="Тема будет скрыта из форума. Это действие нельзя отменить."
            isPending={deleteMutation.isPending}
          />
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
              <CommentItem
                key={comment.id}
                comment={comment}
                threadId={thread.id}
                onReplyAdded={() => queryClient.invalidateQueries({ queryKey: ["forum", threadId] })}
              />
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
