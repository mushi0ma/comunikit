/* comunikit — ListingCard component
   Design: RunPod-inspired compact card with left type stripe
*/
import { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import { Listing, formatPrice, getTypeLabel, getTypeColor, getStripeColor } from "@/lib/mockData";
import { useLocation } from "wouter";
import { Heart, Bookmark } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface ListingCardProps {
  listing: Listing;
  view?: "grid" | "list";
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [, navigate] = useLocation();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const queryClient = useQueryClient();

  const handleClick = () => navigate(`/listing/${listing.id}`);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/listings/${listing.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ value: 1 }),
      });
      setLiked((prev) => !prev);
    } catch {
      // optimistic toggle even on error for now
      setLiked((prev) => !prev);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ listingId: listing.id }),
      });
      setBookmarked((prev) => !prev);
      void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    } catch {
      // optimistic toggle even on error for now
      setBookmarked((prev) => !prev);
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer min-h-[80px] sm:min-h-[110px]"
      onClick={handleClick}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 sm:w-[3px]", getStripeColor(listing.type))} />
      <div className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 sm:line-clamp-2">{listing.title}</h3>
          <span className={cn(getTypeColor(listing.type), "shrink-0")}>{getTypeLabel(listing.type)}</span>
        </div>
        <p className="hidden sm:block text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between sm:mt-1">
          <span className="ck-price text-xs sm:text-sm">
            {listing.price ? formatPrice(listing.price) : "Договорная"}
          </span>
          <span className="text-xs font-mono text-muted-foreground">{timeAgo(listing.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleLike}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Нравится"
          >
            <Heart className={cn("w-4 h-4", liked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
          <button
            onClick={handleBookmark}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="В закладки"
          >
            <Bookmark className={cn("w-4 h-4", bookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        </div>
      </div>
    </div>
  );
}
