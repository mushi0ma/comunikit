/* comunikit — ListingCard component
   Design: RunPod-inspired compact card with left type stripe
*/
import { cn, timeAgo } from "@/lib/utils";
import { Listing, formatPrice, getTypeLabel, getTypeColor, getStripeColor } from "@/lib/mockData";
import { resolveLocationText } from "@/lib/locationUtils";
import { useLocation } from "wouter";
import { Heart, Bookmark, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface ListingCardProps {
  listing: Listing;
  view?: "grid" | "list";
}

interface InteractionStatus {
  saved: boolean;
  liked: boolean;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: status } = useQuery<InteractionStatus>({
    queryKey: ["interaction-status", listing.id, "listing"],
    queryFn: () =>
      apiFetch<InteractionStatus>(
        `/api/users/me/status?targetId=${listing.id}&targetType=listing`,
      ),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const liked = status?.liked ?? false;
  const bookmarked = status?.saved ?? false;

  const handleClick = () => navigate(`/listing/${listing.id}`);

  const statusKey = ["interaction-status", listing.id, "listing"];

  const likeMutation = useMutation({
    mutationFn: () => apiFetch(`/api/users/me/like/listing/${listing.id}`, { method: "POST" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      const prev = queryClient.getQueryData<InteractionStatus>(statusKey);
      queryClient.setQueryData<InteractionStatus>(statusKey, old => ({
        saved: old?.saved ?? false,
        liked: !(old?.liked ?? false),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(statusKey, ctx.prev);
      toast.error("Ошибка");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: statusKey });
      void queryClient.invalidateQueries({ queryKey: ["users", "liked"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => apiFetch(`/api/users/me/save/listing/${listing.id}`, { method: "POST" }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      const prev = queryClient.getQueryData<InteractionStatus>(statusKey);
      queryClient.setQueryData<InteractionStatus>(statusKey, old => ({
        liked: old?.liked ?? false,
        saved: !(old?.saved ?? false),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(statusKey, ctx.prev);
      toast.error("Ошибка");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: statusKey });
      void queryClient.invalidateQueries({ queryKey: ["users", "saved"] });
      void queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarkMutation.mutate();
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
        {listing.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{resolveLocationText(listing.location)}</span>
          </div>
        )}
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
