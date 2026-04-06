/* comunikit — ProfilePage
   Design: RunPod settings pattern — profile header card, tabbed sections
   Features: profile edit modal, seller reviews with star ratings
*/
import { useState } from "react";
import {
  Star, LogOut, Edit3, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { MOCK_USER, MOCK_LISTINGS } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type Tab = "listings" | "favorites" | "reviews";

const TABS: { value: Tab; label: string }[] = [
  { value: "listings", label: "Мои объявления" },
  { value: "favorites", label: "Избранное" },
  { value: "reviews", label: "Отзывы" },
];

const MOCK_REVIEWS = [
  { id: "1", author: "Сейткали Д.", group: "IT-22-A", rating: 5, text: "Отличный продавец, всё как описано!", date: "1 неделю назад" },
  { id: "2", author: "Ким А.", group: "CS-21-K", rating: 5, text: "Быстро ответил, честная сделка.", date: "2 недели назад" },
  { id: "3", author: "Петров И.", group: "IT-21-B", rating: 4, text: "Хорошо, рекомендую.", date: "1 месяц назад" },
];

/* ── StarRating ───────────────────────────────────────────────── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const user = useAuthStore(s => s.user);

  /* ── Edit modal state ───────────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(
    (user?.user_metadata?.name as string) || MOCK_USER.name
  );
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: editName },
      });
      if (error) throw error;
      toast.success("Профиль обновлён");
      setEditing(false);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const displayName = (user?.user_metadata?.name as string) || MOCK_USER.name;
  const myListings = MOCK_LISTINGS.filter(l => l.author.id === "u1");
  const favListings = MOCK_LISTINGS.slice(2, 5);

  return (
    <AppLayout title="Профиль">
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-0">
        {/* ── Profile header card ─────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-16 sm:size-20 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/10 text-xl sm:text-2xl font-black text-primary">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="text-lg sm:text-xl font-bold text-foreground">{displayName}</div>
            {(user?.user_metadata?.group || MOCK_USER.group) && (
              <div className="mt-0.5 font-mono text-sm text-muted-foreground">
                {(user?.user_metadata?.group as string) ?? MOCK_USER.group}
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{MOCK_USER.listingsCount} объявлений</Badge>
              <Badge variant="outline">{MOCK_USER.rating}★ ({MOCK_USER.reviewCount} отзывов)</Badge>
              {(() => {
                const karma = (user?.user_metadata?.karma as number) ?? MOCK_USER.karma;
                return (
                  <Badge
                    variant="outline"
                    className={cn(
                      karma > 0 ? "text-primary border-primary/30" : karma < 0 ? "text-red-400 border-red-400/30" : ""
                    )}
                  >
                    {karma > 100 ? "🔥 " : ""}Карма: {karma}
                  </Badge>
                );
              })()}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start"
            onClick={() => {
              setEditName(displayName);
              setEditing(true);
            }}
          >
            <Edit3 className="size-3.5" /> Редактировать
          </Button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────── */}
        <div className="mt-4">
          {activeTab === "listings" && <ListingsTab listings={myListings} />}
          {activeTab === "favorites" && <FavoritesTab listings={favListings} />}
          {activeTab === "reviews" && <ReviewsTab />}
        </div>

        {/* ── Logout ────────────────────────────────────── */}
        <Button
          variant="outline"
          className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 mt-6"
          onClick={() => {
            toast.success("Вы вышли из аккаунта");
            window.location.href = "/login";
          }}
        >
          <LogOut className="size-4" /> Выйти из аккаунта
        </Button>
      </div>

      {/* ── Edit profile modal ──────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-foreground">Редактировать профиль</h3>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Имя</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                className="flex-1"
                onClick={saveProfile}
                disabled={saving || editName.trim().length === 0}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ── Listings tab ─────────────────────────────────────────── */

function ListingsTab({ listings }: { listings: typeof MOCK_LISTINGS }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground ck-animate-in">
        <Package className="mx-auto mb-3 size-12 opacity-30" />
        <p className="font-semibold">Нет объявлений</p>
        <p className="mt-1 text-sm">Создайте первое объявление</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ck-animate-in lg:grid-cols-3">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/* ── Favorites tab ────────────────────────────────────────── */

function FavoritesTab({ listings }: { listings: typeof MOCK_LISTINGS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ck-animate-in lg:grid-cols-3">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/* ── Reviews tab ──────────────────────────────────────────── */

function ReviewsTab() {
  return (
    <div className="space-y-3 ck-animate-in">
      {MOCK_REVIEWS.map(r => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {r.author[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{r.author}</p>
                <p className="text-xs text-muted-foreground">{r.group}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StarRating rating={r.rating} />
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
