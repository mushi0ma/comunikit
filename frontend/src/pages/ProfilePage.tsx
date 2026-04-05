/* comunikit — ProfilePage
   Design: RunPod settings pattern — profile header card, tabbed sections, settings cards
*/
import { useState } from "react";
import {
  Star, LogOut, Bell, Moon, Sun, Monitor,
  MessageCircle, Shield, ChevronRight, Edit3, Package,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import { MOCK_USER, MOCK_LISTINGS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

type Tab = "listings" | "favorites" | "reviews" | "settings";

const TABS: { value: Tab; label: string }[] = [
  { value: "listings", label: "Мои объявления" },
  { value: "favorites", label: "Избранное" },
  { value: "reviews", label: "Отзывы" },
  { value: "settings", label: "Настройки" },
];

const MOCK_REVIEWS = [
  { id: "r1", author: "Сейткали Д.", group: "IT-22-A", rating: 5, text: "Отличный продавец, всё как описано!", time: "1 неделю назад" },
  { id: "r2", author: "Ким А.", group: "CS-21-K", rating: 5, text: "Быстро ответил, честная сделка.", time: "2 недели назад" },
  { id: "r3", author: "Петров И.", group: "IT-21-B", rating: 4, text: "Хорошо, рекомендую.", time: "1 месяц назад" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [telegramHandle, setTelegramHandle] = useState(MOCK_USER.telegramHandle || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const myListings = MOCK_LISTINGS.filter(l => l.author.id === "u1");
  const favListings = MOCK_LISTINGS.slice(2, 5);

  return (
    <AppLayout title="Профиль">
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-0">
        {/* ── Profile header card ─────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-20 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/10 text-2xl font-black text-primary">
              {MOCK_USER.name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="text-xl font-bold text-foreground">{MOCK_USER.name}</div>
            <div className="mt-0.5 font-mono text-sm text-muted-foreground">
              {MOCK_USER.group} · ID: {MOCK_USER.studentId}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{MOCK_USER.listingsCount} объявлений</Badge>
              <Badge variant="outline">{MOCK_USER.rating}★ ({MOCK_USER.reviewCount} отзывов)</Badge>
              <Badge variant="outline">Карма: {MOCK_USER.karma}</Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start"
            onClick={() => toast.info("Редактирование профиля")}
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
          {activeTab === "settings" && (
            <SettingsTab
              telegramHandle={telegramHandle}
              onTelegramChange={setTelegramHandle}
              notificationsEnabled={notificationsEnabled}
              onNotificationsChange={setNotificationsEnabled}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/* ── Section wrapper (RunPod card style) ──────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 border-b border-border pb-2 text-lg font-bold text-foreground">
        {title}
      </h3>
      {children}
    </div>
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
    <div className="grid grid-cols-2 gap-3 ck-animate-in lg:grid-cols-3">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/* ── Favorites tab ────────────────────────────────────────── */

function FavoritesTab({ listings }: { listings: typeof MOCK_LISTINGS }) {
  return (
    <div className="grid grid-cols-2 gap-3 ck-animate-in lg:grid-cols-3">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/* ── Reviews tab ──────────────────────────────────────────── */

function ReviewsTab() {
  return (
    <div className="flex flex-col gap-3 ck-animate-in">
      {MOCK_REVIEWS.map(r => (
        <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {r.author[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{r.author}</p>
                <p className="text-xs text-muted-foreground">{r.group}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={cn(
                    "size-3.5",
                    i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-foreground/80">{r.text}</p>
          <p className="text-xs text-muted-foreground">{r.time}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Settings tab (RunPod settings style) ─────────────────── */

function SettingsTab({
  telegramHandle,
  onTelegramChange,
  notificationsEnabled,
  onNotificationsChange,
  theme,
  onToggleTheme,
}: {
  telegramHandle: string;
  onTelegramChange: (v: string) => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (v: boolean) => void;
  theme: string;
  onToggleTheme?: () => void;
}) {
  const themeOptions = [
    { value: "dark", label: "Тёмная", Icon: Moon },
    { value: "light", label: "Светлая", Icon: Sun },
    { value: "system", label: "Системная", Icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-4 ck-animate-in">
      {/* ── Theme ─────────────────────────────────────── */}
      <Section title="Оформление">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold">Тема интерфейса</Label>
          <div className="flex gap-2">
            {themeOptions.map(opt => {
              const isActive =
                (opt.value === "dark" && theme === "dark") ||
                (opt.value === "light" && theme === "light") ||
                (opt.value === "system" && false);

              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value === "system") {
                      toast.info("Системная тема в разработке");
                      return;
                    }
                    if (theme !== opt.value && onToggleTheme) onToggleTheme();
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  <opt.Icon className="size-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Telegram connection card ──────────────────── */}
      <Section title="Интеграции">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex items-start gap-3 sm:flex-1">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#229ED9]/10">
              <Send className="size-5 text-[#229ED9]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Telegram</span>
                {telegramHandle ? (
                  <Badge variant="outline" className="text-xs text-green-600">Подключён</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Не подключён</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Покупатели смогут связаться с вами через Telegram
              </p>
              <div className="mt-2">
                <Input
                  placeholder="@username"
                  value={telegramHandle}
                  onChange={e => onTelegramChange(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Telegram сохранён")}
          >
            Сохранить
          </Button>
        </div>
      </Section>

      {/* ── Notifications ─────────────────────────────── */}
      <Section title="Уведомления">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Push-уведомления</p>
              <p className="text-xs text-muted-foreground">Новые сообщения и ответы</p>
            </div>
          </div>
          <Switch checked={notificationsEnabled} onCheckedChange={onNotificationsChange} />
        </div>
      </Section>

      {/* ── Security ──────────────────────────────────── */}
      <Section title="Безопасность">
        <div className="flex flex-col divide-y divide-border">
          {["Сменить пароль", "Привязанные устройства", "История входов"].map(item => (
            <button
              key={item}
              onClick={() => toast.info("Функция в разработке")}
              className="flex items-center justify-between py-3 text-sm text-foreground transition-colors first:pt-0 last:pb-0 hover:text-primary"
            >
              {item}
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </Section>

      {/* ── Logout ────────────────────────────────────── */}
      <Button
        variant="outline"
        className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
        onClick={() => {
          toast.success("Вы вышли из аккаунта");
          window.location.href = "/login";
        }}
      >
        <LogOut className="size-4" /> Выйти из аккаунта
      </Button>
    </div>
  );
}
