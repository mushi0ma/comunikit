/* comunikit — ListingCard component
   Design: RunPod-inspired compact card with left type stripe
*/
import { cn } from "@/lib/utils";
import { Listing, formatPrice, getTypeLabel, getTypeColor, getStripeColor } from "@/lib/mockData";
import { useLocation } from "wouter";

interface ListingCardProps {
  listing: Listing;
  view?: "grid" | "list";
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [, navigate] = useLocation();
  const handleClick = () => navigate(`/listing/${listing.id}`);

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
          <span className="text-xs font-mono text-muted-foreground">{listing.createdAt}</span>
        </div>
      </div>
    </div>
  );
}
