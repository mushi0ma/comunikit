/* comunikit — ListingDetail
   Design: "Digital Bazaar" — full listing view with gallery, author card, comments
*/
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Star, Eye, Clock, MapPin, Phone, MessageCircle,
  Send, ChevronLeft, ChevronRight, Share2, Flag, Heart, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { MOCK_LISTINGS, formatPrice, getTypeLabel, getTypeColor, getStripeColor } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOCK_COMMENTS = [
  { id: "c1", author: "Сейткали Д.", group: "IT-22-A", text: "Ещё актуально?", time: "1h ago" },
  { id: "c2", author: "Ким А.", group: "CS-21-K", text: "Возможен торг?", time: "3h ago" },
  { id: "c3", author: "Петров И.", group: "IT-21-B", text: "Отличное объявление, рекомендую продавца!", time: "1d ago" },
];

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const listing = MOCK_LISTINGS.find(l => l.id === params.id) || MOCK_LISTINGS[0];

  const [imgIdx, setImgIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS);

  const images = listing.images.length > 0 ? listing.images : [""];
  const related = MOCK_LISTINGS.filter(l => l.id !== listing.id && l.category === listing.category).slice(0, 3);

  const handleSendComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [{ id: `c${Date.now()}`, author: "Алиев А.", group: "CS-21-K", text: comment, time: "сейчас" }, ...prev]);
    setComment("");
    toast.success("Комментарий добавлен");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к ленте
        </button>

        {/* Image gallery */}
        <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
          {images[0] ? (
            <img src={images[imgIdx] || images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-16 h-16 opacity-30" /></div>
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setImgIdx(i => Math.max(0, i - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={cn("w-2 h-2 rounded-full transition-all", i === imgIdx ? "bg-white w-4" : "bg-white/50")}
                  />
                ))}
              </div>
            </>
          )}
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
            </button>
            <button
              onClick={() => toast.info("Ссылка скопирована")}
              className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title + price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(getTypeColor(listing.type))}>
                  {(listing.type === "lost" || listing.type === "found") && (
                    <span className={cn("w-2 h-2 rounded-full inline-block mr-1", listing.type === "lost" ? "bg-red-500" : "bg-green-500")} />
                  )}
                  {getTypeLabel(listing.type)}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{listing.category}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold",
                  listing.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                )}>
                  {listing.status === "active" ? "Активно" : "Закрыто"}
                </span>
              </div>
              <h1 className="text-xl font-black text-foreground leading-snug" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                {listing.title}
              </h1>
            </div>
          </div>
          {listing.price && (
            <div className="mt-3">
              <span className="ck-price text-3xl">{formatPrice(listing.price)}</span>
              {listing.negotiable && <span className="text-sm text-muted-foreground ml-2">· торг уместен</span>}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{listing.createdAt}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.views} просмотров</span>
          </div>
        </div>

        {/* Author card */}
        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-lg">
              {listing.author.name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{listing.author.name}</p>
              <p className="text-sm text-muted-foreground">{listing.author.group}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-amber-600">{listing.author.rating}</span>
                <span className="text-xs text-muted-foreground">({listing.author.reviewCount} отзывов)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                setShowContact(!showContact);
                if (!showContact) toast.success("Контакт раскрыт");
              }}
            >
              <Phone className="w-4 h-4" />
              {showContact ? listing.author.telegramHandle || "+7 (700) ***-**-**" : "Показать контакт"}
            </Button>
            {listing.author.telegramHandle && (
              <Button
                className="flex-1 gap-2"
                style={{ background: "#229ED9" }}
                onClick={() => toast.info(`Открываем Telegram: ${listing.author.telegramHandle}`)}
              >
                <MessageCircle className="w-4 h-4" />
                Telegram
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-foreground">Описание</h2>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>

        {/* Location (Lost & Found) */}
        {listing.location && (
          <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Место
            </h2>
            <p className="text-sm text-foreground/80">{listing.location}</p>
            <div
              className="rounded-xl overflow-hidden h-32 relative"
              style={{
                background: "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-campus-map-bg-T8ZyHrwYhDrtVNt496PAhT.webp) center/cover no-repeat"
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
              </div>
              <button
                onClick={() => window.location.href = "/map"}
                className="absolute bottom-2 right-2 text-xs bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg font-semibold text-foreground hover:bg-background transition-colors"
              >
                Открыть карту →
              </button>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Комментарии ({comments.length})</h2>
          {/* Add comment */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">А</div>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Написать комментарий..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[40px] h-10 resize-none text-sm py-2"
                rows={1}
              />
              <Button size="icon" onClick={handleSendComment} disabled={!comment.trim()}
                style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Comment list */}
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2 ck-animate-in">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0">
                  {c.author[0]}
                </div>
                <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-foreground">{c.author}</span>
                    <span className="text-xs text-muted-foreground">{c.group}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{c.time}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">Похожие объявления</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {related.map(l => <ListingCard key={l.id} listing={l} />)}
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
