/* comunikit — ListingCard component
   Design: "Digital Bazaar" — card with diagonal stripe, price in JetBrains Mono
*/
import { Heart, Star, Eye, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Listing, formatPrice, getTypeLabel, getTypeColor, getStripeColor } from "@/lib/mockData";
import { useState } from "react";
import { useLocation } from "wouter";

interface ListingCardProps {
  listing: Listing;
  view?: "grid" | "list";
}

export default function ListingCard({ listing, view = "grid" }: ListingCardProps) {
  const [liked, setLiked] = useState(false);
  const [, navigate] = useLocation();

  const handleClick = () => navigate(`/listing/${listing.id}`);

  if (view === "list") {
    return (
      <div
        className="ck-card flex gap-3 p-3 cursor-pointer ck-animate-in"
        onClick={handleClick}
      >
        {/* Stripe */}
        <div className={cn("ck-card-stripe", getStripeColor(listing.type))} />

        {/* Image */}
        <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-muted ml-1">
          {listing.images[0] ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">📦</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className={cn(getTypeColor(listing.type), "mb-1")}>
                {listing.type === "lost" ? "🔴" : listing.type === "found" ? "🟢" : ""} {getTypeLabel(listing.type)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                className="shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "")} />
              </button>
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{listing.title}</h3>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div>
              {listing.price ? (
                <span className="ck-price text-base">{formatPrice(listing.price)}</span>
              ) : listing.type === "sell" ? (
                <span className="ck-price text-sm text-muted-foreground">Договорная</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{listing.createdAt}</span>
              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{listing.views}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold shrink-0">
              {listing.author.name[0]}
            </div>
            <span className="text-xs text-muted-foreground truncate">{listing.author.name} · {listing.author.group}</span>
            <span className="flex items-center gap-0.5 text-xs text-amber-500 ml-auto shrink-0">
              <Star className="w-3 h-3 fill-amber-400" />{listing.author.rating}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className="ck-card flex flex-col cursor-pointer ck-animate-in group"
      onClick={handleClick}
    >
      {/* Stripe */}
      <div className={cn("ck-card-stripe", getStripeColor(listing.type))} />

      {/* Image */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted ml-1">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
        {/* Badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={cn(getTypeColor(listing.type))}>
            {listing.type === "lost" ? "🔴" : listing.type === "found" ? "🟢" : ""} {getTypeLabel(listing.type)}
          </span>
        </div>
        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Heart className={cn("w-3.5 h-3.5", liked ? "fill-red-500 text-red-500" : "")} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-3 ml-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug mb-2">{listing.title}</h3>

        {/* Price */}
        <div className="mb-2">
          {listing.price ? (
            <div className="flex items-baseline gap-1">
              <span className="ck-price text-lg">{formatPrice(listing.price)}</span>
              {listing.negotiable && <span className="text-xs text-muted-foreground">· торг</span>}
            </div>
          ) : listing.type === "sell" ? (
            <span className="text-sm text-muted-foreground font-medium">Договорная</span>
          ) : listing.location ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />{listing.location}
            </span>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
              {listing.author.name[0]}
            </div>
            <span className="text-xs text-muted-foreground truncate">{listing.author.name} · {listing.author.group}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="w-3 h-3 fill-amber-400" />{listing.author.rating}
            </span>
            <span className="text-xs text-muted-foreground">{listing.createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
