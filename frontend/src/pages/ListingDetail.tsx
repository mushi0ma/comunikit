/* comunikit — ListingDetail
   Design: RunPod-inspired settings layout — two-column gallery + details
*/
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, MapPin, Package, Heart, Bookmark, Clock,
  MessageCircle, Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { MOCK_LISTINGS, formatPrice, getTypeLabel, getTypeColor } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const listing = MOCK_LISTINGS.find(l => l.id === params.id) || MOCK_LISTINGS[0];

  const [imgIdx, setImgIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  const images = listing.images.length > 0 ? listing.images : [""];
  const related = MOCK_LISTINGS.filter(l => l.id !== listing.id && l.category === listing.category).slice(0, 3);

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {listing.author.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{listing.author.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  Student ID: {listing.author.group}
                </p>
              </div>
            </div>

            {/* Posted time */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {listing.createdAt}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full gap-2"
                onClick={() => {
                  if (listing.author.telegramHandle) {
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
                className="w-full gap-2"
                onClick={() => toast.success("Объявление сохранено")}
              >
                <Bookmark className="w-4 h-4" />
                Сохранить
              </Button>
            </div>
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
