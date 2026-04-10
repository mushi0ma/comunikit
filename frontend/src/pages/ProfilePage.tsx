/* comunikit — ProfilePage
   Design: RunPod settings pattern — profile header card, tabbed sections
   Features: profile edit modal, seller reviews with star ratings
*/
import { useState } from "react";
import {
  Star, LogOut, Edit3, Package, ShieldCheck, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

type Tab = "listings" | "reviews";

const TABS: { value: Tab; label: string }[] = [
  { value: "listings", label: "Мои объявления" },
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

interface MeProfile {
  id: string;
  name: string;
  email: string | null;
  karma: number;
  isStudentVerified: boolean;
  studentId: string | null;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const user = useAuthStore(s => s.user);
  const refreshUser = useAuthStore(s => s.refreshUser);
  const signOut = useAuthStore(s => s.signOut);

  /* ── Backend profile (source of truth for verification status) ── */
  const { data: profile } = useQuery<MeProfile>({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<MeProfile>("/api/users/me"),
    enabled: !!user?.id,
  });

  const displayName =
    profile?.name || (user?.user_metadata?.name as string) || "Студент AITU";
  const userGroup = (user?.user_metadata?.group as string) || "";
  const userEmail = profile?.email ?? user?.email ?? "";
  const karma = profile?.karma ?? (user?.user_metadata?.karma as number) ?? 0;
  const isVerified = profile?.isStudentVerified ?? false;

  /* ── My listings query ────────────────────────────── */
  const { data: myListings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["my-listings", user?.id],
    queryFn: () => apiFetch<Listing[]>(`/api/listings?authorId=${user!.id}`),
    enabled: !!user?.id,
  });

  /* ── Edit modal state ───────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editGroup, setEditGroup] = useState(userGroup);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: editName.trim(), group: editGroup.trim() },
      });
      if (error) throw error;
      // Explicitly refresh user in the store so UI updates instantly
      await refreshUser();
      toast.success("Профиль обновлён");
      setEditing(false);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

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
            {userGroup && (
              <div className="mt-0.5 font-mono text-sm text-muted-foreground">
                {userGroup}
              </div>
            )}
            {userEmail && (
              <div className="mt-0.5 text-xs text-muted-foreground">{userEmail}</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{myListings?.length ?? 0} объявлений</Badge>
              {(() => (
                <Badge
                  variant="outline"
                  className={cn(
                    karma > 0 ? "text-primary border-primary/30" : karma < 0 ? "text-red-400 border-red-400/30" : ""
                  )}
                >
                  Карма: {karma}
                </Badge>
              ))()}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start"
            onClick={() => {
              setEditName(displayName);
              setEditGroup(userGroup);
              setEditing(true);
            }}
          >
            <Edit3 className="size-3.5" /> Редактировать
          </Button>
        </div>

        {/* ── Verification CTA (hidden once the OCR flow persists verification) ── */}
        {!isVerified && (
          <Link href="/verify-id">
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 cursor-pointer transition-colors hover:bg-amber-500/10">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                <ShieldCheck className="size-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Аккаунт не верифицирован</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Пройдите верификацию студенческого билета, чтобы получить полный доступ
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        )}

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
          {activeTab === "listings" && <ListingsTab listings={myListings ?? []} isLoading={listingsLoading} />}
          {activeTab === "reviews" && <ReviewsTab />}
        </div>

        {/* ── Logout ────────────────────────────────────── */}
        <Button
          variant="outline"
          className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 mt-6"
          onClick={async () => {
            await signOut();
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

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Группа</label>
              <Input
                value={editGroup}
                onChange={e => setEditGroup(e.target.value)}
                placeholder="IT-23-A"
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

function ListingsTab({ listings, isLoading }: { listings: Listing[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

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

/* ── Reviews tab ──────────────────────────────────────────── */
// TODO: Replace MOCK_REVIEWS with real API call once backend reviews endpoint is ready
// TODO: Each review should include author.id from the API to enable profile linking

function ReviewsTab() {
  return (
    <div className="space-y-3 ck-animate-in">
      {MOCK_REVIEWS.map(r => (
        <div key={r.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* TODO: replace hardcoded href with /profile/${r.authorId} once API returns author id */}
              <Link href={`/profile/${r.id}`}>
                <div className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
              </Link>
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
