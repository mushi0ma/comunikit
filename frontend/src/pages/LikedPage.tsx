/* comunikit — LikedPage
   Liked listings & threads with tabs
*/
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { type Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";

/* ── types ─────────────────────────────────────────────────── */

interface LikedData {
  listings: Listing[];
}

/* ── page ─────────────────────────────────────────────────── */

export default function LikedPage() {
  const { data, isLoading } = useQuery<LikedData>({
    queryKey: ["users", "liked"],
    queryFn: () => apiFetch<LikedData>("/api/users/me/liked"),
  });

  const listings = data?.listings ?? [];

  return (
    <AppLayout title="Понравилось">
      <div className="container max-w-2xl py-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
            <Heart className="size-4 text-red-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Понравилось</h1>
            <p className="text-xs text-muted-foreground">
              {listings.length} объявлений
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          listings.length === 0 ? (
            <EmptyState icon={ShoppingBag} text="Нет понравившихся объявлений" />
          ) : (
            <div className="flex flex-col gap-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}

/* ── Empty state ─────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
