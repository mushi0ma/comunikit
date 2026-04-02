/* comunikit — Home (Bento Grid Dashboard)
   Design: 5-card CSS Grid "Bento Box" layout with Shadcn Cards
*/
import { Link } from "wouter";
import {
  User, PlusCircle, Search, MessageSquare, ShoppingBag, MapPin,
  ArrowRight, MessageCircle, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { FloorPlanMap } from "@/components/Map";
import { MOCK_LISTINGS, FORUM_THREADS, formatPrice, getTypeColor } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const MARKETPLACE_PREVIEW = MOCK_LISTINGS.filter((l) => l.status === "active").slice(0, 2);
const FORUM_PREVIEW = FORUM_THREADS[0];

export default function Home() {
  return (
    <AppLayout title="Главная">
      <div className="px-4 py-5 lg:px-6">
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">

          {/* Block 1: Welcome / Profile */}
          <Card className="md:col-span-2 lg:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl" style={{ fontFamily: "Nunito, sans-serif" }}>
                Добро пожаловать в comuni<span className="text-primary">kit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-lg">Студент AITU</p>
                <p className="text-sm text-muted-foreground">CS-23-A · Рейтинг 4.9 · 12 объявлений</p>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  Профиль <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Block 2: Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Быстрые действия</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/create">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                  <PlusCircle className="w-6 h-6 text-primary" />
                  <span className="text-xs font-semibold text-primary">Создать</span>
                </div>
              </Link>
              <Link href="/feed">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                  <Search className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Поиск</span>
                </div>
              </Link>
              <Link href="/forum">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Форум</span>
                </div>
              </Link>
              <Link href="/map">
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-accent transition-colors">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Карта</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Block 3: Marketplace Preview */}
          <Card className="md:col-span-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" /> Маркетплейс
              </CardTitle>
              <Link href="/feed">
                <span className="text-xs text-primary font-semibold hover:underline">Все</span>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {MARKETPLACE_PREVIEW.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors -mx-1">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(getTypeColor(item.type), "text-[10px]")}>{item.type}</span>
                        {item.price != null && (
                          <span className="text-xs font-mono font-semibold text-primary">{formatPrice(item.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Block 4: Forum Active Thread */}
          <Card className="md:col-span-1">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" /> Форум
              </CardTitle>
              <Link href="/forum">
                <span className="text-xs text-primary font-semibold hover:underline">Все</span>
              </Link>
            </CardHeader>
            {FORUM_PREVIEW && (
              <CardContent>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {FORUM_PREVIEW.category}
                    </span>
                    {FORUM_PREVIEW.pinned && (
                      <span className="text-[10px] font-semibold text-muted-foreground">Закреплено</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug">{FORUM_PREVIEW.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{FORUM_PREVIEW.author.name}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {FORUM_PREVIEW.replies}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {FORUM_PREVIEW.lastActivity}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Block 5: Map Preview */}
          <Card className="md:col-span-2 lg:col-span-1 group overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Карта кампуса
              </CardTitle>
              <Link href="/map">
                <span className="text-xs text-primary font-semibold hover:underline">Открыть</span>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden pointer-events-none">
                <div className="transition-transform duration-300 group-hover:scale-105 origin-center">
                  <FloorPlanMap floor={1} interactive={false} />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
