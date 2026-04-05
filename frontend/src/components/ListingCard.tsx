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

export default function ListingCard({ listing, view = "grid" }: ListingCardProps) {
  const [, navigate] = useLocation();
  const handleClick = () => navigate(`/listing/${listing.id}`);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", getStripeColor(listing.type))} />
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{listing.title}</h3>
          <span className={cn(getTypeColor(listing.type), "shrink-0")}>{getTypeLabel(listing.type)}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="ck-price">
            {listing.price ? formatPrice(listing.price) : "Договорная"}
          </span>
          <span className="text-xs text-muted-foreground">{listing.createdAt}</span>
        </div>
      </div>
    </div>
  );
}
