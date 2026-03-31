/* comunikit — ProfilePage
   Design: "Digital Bazaar" — avatar header, stats row, tabs for listings/favorites/reviews/settings
*/
import { useState } from "react";
import {
  Camera, Star, Settings, LogOut, Bell, Moon, Sun,
  MessageCircle, Shield, ChevronRight, Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {/* Profile header */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background gradient */}
          <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #F97316, #FB923C, #0EA5E9)" }} />
          {/* Avatar */}
          <div className="px-5 pb-4">
            <div className="flex items-end justify-between -mt-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-background flex items-center justify-center text-primary font-black text-3xl shadow-lg"
                  style={{ fontFamily: "Nunito, sans-serif" }}>
                  {MOCK_USER.name[0]}
                </div>
                <button
                  onClick={() => toast.info("Загрузка фото в разработке")}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Редактирование профиля")}>
                <Edit3 className="w-3.5 h-3.5" /> Редактировать
              </Button>
            </div>
            <div className="mt-3">
              <h1 className="text-xl font-black text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
                {MOCK_USER.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-muted-foreground">{MOCK_USER.group}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground font-mono">{MOCK_USER.studentId}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={cn("w-4 h-4", i <= Math.round(MOCK_USER.rating) ? "fill-amber-400 text-amber-400" : "text-muted")} />
                ))}
                <span className="text-sm font-bold text-amber-600 ml-1">{MOCK_USER.rating}</span>
                <span className="text-xs text-muted-foreground">({MOCK_USER.reviewCount} отзывов)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Объявлений", value: MOCK_USER.listingsCount },
            { label: "Отзывов", value: MOCK_USER.reviewCount },
            { label: "Карма", value: MOCK_USER.karma },
          ].map(stat => (
            <div key={stat.label} className="p-3 rounded-xl bg-card border border-border text-center">
              <div className="text-2xl font-black text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === tab.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "listings" && (
          <div className="space-y-3 ck-animate-in">
            {myListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-semibold">Нет объявлений</p>
                <p className="text-sm mt-1">Создайте первое объявление</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myListings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-3 ck-animate-in">
            <div className="grid grid-cols-2 gap-3">
              {favListings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3 ck-animate-in">
            {MOCK_REVIEWS.map(r => (
              <div key={r.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {r.author[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{r.author}</p>
                      <p className="text-xs text-muted-foreground">{r.group}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn("w-3.5 h-3.5", i <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{r.text}</p>
                <p className="text-xs text-muted-foreground">{r.time}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4 ck-animate-in">
            {/* Telegram */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#229ED9]" /> Telegram
              </h3>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Telegram handle</Label>
                <Input
                  placeholder="@username"
                  value={telegramHandle}
                  onChange={e => setTelegramHandle(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.success("Telegram сохранён")}>
                Сохранить
              </Button>
            </div>

            {/* Notifications */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> Уведомления
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Push-уведомления</p>
                  <p className="text-xs text-muted-foreground">Новые сообщения и ответы</p>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </div>

            {/* Theme */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                  <div>
                    <p className="text-sm font-semibold text-foreground">Тёмная тема</p>
                    <p className="text-xs text-muted-foreground">Текущая: {theme === "dark" ? "тёмная" : "светлая"}</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
            </div>

            {/* Security */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Безопасность
              </h3>
              {["Сменить пароль", "Привязанные устройства", "История входов"].map(item => (
                <button
                  key={item}
                  onClick={() => toast.info("Функция в разработке")}
                  className="w-full flex items-center justify-between py-2 text-sm text-foreground hover:text-primary transition-colors"
                >
                  {item}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Logout */}
            <Button
              variant="outline"
              className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/5 gap-2"
              onClick={() => { toast.success("Вы вышли из аккаунта"); window.location.href = "/login"; }}
            >
              <LogOut className="w-4 h-4" /> Выйти из аккаунта
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
