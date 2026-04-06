/* comunikit — ListingDetail
   Design: RunPod-inspired settings layout — two-column gallery + details + comments
   Fixed: now fetches real listing from API by ID instead of MOCK_LISTINGS lookup
*/
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Package, Heart, Bookmark, BookmarkCheck, Clock,
  MessageCircle, Flag, Send, Loader2, ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { type Listing, formatPrice, getTypeLabel, getTypeColor } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import LoadingScreen from "@/components/LoadingScreen";

/* ── types ─────────────────────────────────────────────────── */
interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string | null;
  karma: number;
}

interface ApiComment {
  id: string;
  body: string;
  authorId: string;
  author: CommentAuthor;
  createdAt: string;
  _count?: { votes: number };
  replies?: ApiComment[];
}

/* ── CommentVote component ────────────────────────────────── */

function CommentVote({ commentId, initialVotes }: { commentId: string; initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);

  async function vote() {
    try {
      await apiFetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value: voted ? -1 : 1 }),
      });
      setVotes(v => voted ? v - 1 : v + 1);
      setVoted(!voted);
    } catch {
      toast.error("Ошибка голосования");
    }
  }

  return (
    <button
      onClick={vote}
      className={cn(
        "flex items-center gap-1 text-xs transition-colors mt-1",
        voted ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <ThumbsUp className="size-3" />
      <span>{votes > 0 ? votes : "Нравится"}</span>
    </button>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();

  /* ── Fetch listing from API by ID ──────────────────────── */
  const { data: listing, isLoading: listingLoading } = useQuery<Listing>({
    queryKey: ["listing", params.id],
    queryFn: () => apiFetch<Listing>(`/api/listings/${params.id}`),
    retry: false,
  });

  /* ── Fetch related listings by category ────────────────── */
  const { data: relatedListings = [] } = useQuery<Listing[]>({
    queryKey: ["listings", "related", listing?.category, params.id],
    queryFn: async () => {
      if (!listing?.category) return [];
      const all = await apiFetch<Listing[]>(`/api/listings?category=${encodeURIComponent(listing.category)}&limit=4`);
      return all.filter(l => l.id !== listing.id).slice(0, 3);
    },
    enabled: !!listing?.category,
  });

  /* ── Comments API ──────────────────────────────────────── */
  const { data: comments = [], isLoading: commentsLoading } = useQuery<ApiComment[]>({
    queryKey: ["comments", "listing", params.id],
    queryFn: async () => {
      try {
        return await apiFetch<ApiComment[]>(`/api/comments?listingId=${params.id}`);
      } catch {
        return [];
      }
    },
    enabled: !!listing,
  });

  const createCommentMut = useMutation({
    mutationFn: (body: string) =>
      apiFetch<ApiComment>("/api/comments", {
        method: "POST",
        body: JSON.stringify({ body, listingId: params.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", "listing", params.id] });
      setCommentText("");
      toast.success("Комментарий добавлен");
    },
    onError: (err: Error) => toast.error(err.message),
  });


  function submitComment() {
    if (!isAuthenticated) {
      toast.error("Войдите, чтобы оставить комментарий");
      return;
    }
    if (commentText.trim().length === 0) return;
    createCommentMut.mutate(commentText.trim());
  }

  /* ── Loading / Not found states ────────────────────────── */
  if (listingLoading) {
    return (
      <AppLayout title="Объявление">
        <LoadingScreen />
      </AppLayout>
    );
  }

  if (!listing) {
    return (
      <AppLayout title="Объявление">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground opacity-40" />
          <h1 className="text-xl font-bold text-foreground">Объявление не найдено</h1>
          <p className="text-sm text-muted-foreground">
            Возможно, оно было удалено или ссылка некорректна.
          </p>
          <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : navigate("/feed")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : [""];
  const isLostFound = listing.type === "lost" || listing.type === "found";

  return (
    <AppLayout title="Объявление">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к ленте
        </button>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — Image gallery (60%) */}
          <div className="lg:w-[60%] space-y-3">
            {/* Main image */}
            <div className="relative rounded-xl border border-border overflow-hidden bg-muted aspect-video">
              {images[0] ? (
                <img
                  src={images[imgIdx] || images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-16 h-16 opacity-30" />
                </div>
              )}
              {/* Like overlay */}
              <button
                onClick={() => setLiked(!liked)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
              >
                <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
              </button>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.slice(0, 4).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                      i === imgIdx ? "border-primary" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details (40%) */}
          <div className="lg:w-[40%] space-y-4">
            {/* Type badge */}
            <span className={cn(getTypeColor(listing.type))}>
              {getTypeLabel(listing.type)}
            </span>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground leading-snug">
              {listing.title}
            </h1>

            {/* Price */}
            {listing.price && (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-semibold text-primary">
                  {formatPrice(listing.price)}
                </span>
                {listing.negotiable && (
                  <span className="text-sm text-muted-foreground">· торг</span>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Status banner (lost/found) */}
            {isLostFound && listing.location && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-red-400">
                    {listing.type === "lost" ? "Потеряно" : "Найдено"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Место: {listing.location}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>

            {/* Author block */}
            {listing.author && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {listing.author.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{listing.author.name}</p>
                  {listing.author.group && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {listing.author.group}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Posted time */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {timeAgo(listing.createdAt)}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (listing.author?.telegramHandle) {
                    toast.info(`Открываем Telegram: ${listing.author.telegramHandle}`);
                  } else {
                    toast.info("Контакт продавца не указан");
                  }
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Написать продавцу
              </Button>
              <Button
                variant="outline"
                className={cn("w-full gap-2 transition-all duration-200", saved && "scale-[1.02]")}
                onClick={() => {
                  setSaved(!saved);
                  toast.success(saved ? "Убрано из сохранённых" : "Сохранено");
                }}
              >
                {saved ? <BookmarkCheck className="w-4 h-4 text-green-400" /> : <Bookmark className="w-4 h-4" />}
                {saved ? "Сохранено" : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Comments Section ─────────────────────────────── */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Комментарии ({comments.length})
          </h3>

          {/* Comment input */}
          <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              ?
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Написать комментарий..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") submitComment();
                }}
              />
              <Button
                size="sm"
                onClick={submitComment}
                disabled={createCommentMut.isPending || commentText.trim().length === 0}
              >
                {createCommentMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Loading comments */}
          {commentsLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Comments list */}
          {!commentsLoading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Пока нет комментариев. Будьте первым!
            </p>
          )}

          {!commentsLoading && comments.map(c => (
            <div key={c.id} className="flex gap-3 ck-animate-in">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {c.author.name[0]}
              </div>
              <div className="flex-1 bg-muted/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{c.author.name}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground/90">{c.body}</p>
                <CommentVote commentId={c.id} initialVotes={c._count?.votes || 0} />
              </div>
            </div>
          ))}
        </div>

        {/* Related listings */}
        {relatedListings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Похожие объявления</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedListings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}

        {/* Report */}
        <div className="flex justify-center pb-4">
          <button
            onClick={() => toast.info("Жалоба отправлена на модерацию")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Flag className="w-3 h-3" /> Пожаловаться на объявление
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
