/* comunikit — Dashboard (Bento Grid)
   Phase 2: "Zinc Magenta Neo-Corporate" — modular bento box layout
   Uses Shadcn Card components with glassmorphism + semantic tokens only.
*/
import { useMemo } from "react";
import { Link } from "wouter";
import {
  PlusCircle, Search, TrendingUp, MessageSquare,
  Eye, Clock, Sparkles, ArrowRight, AlertTriangle,
  CheckCircle2, ShoppingBag,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import {
  Card, CardHeader, CardTitle,
  CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  MOCK_USER, MOCK_LISTINGS, FORUM_THREADS,
  formatPrice, getTypeLabel,
} from "@/lib/mockData";

/* ── Sub-components ──────────────────────────────────────────── */

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "ck-glass rounded-xl border-border/40 shadow-none py-0 overflow-hidden transition-all duration-200 hover:border-border/70",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function StatPill({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <Icon className="size-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */

export default function Home() {
  const trendingItems = useMemo(
    () => MOCK_LISTINGS.filter(l => l.status === "active").slice(0, 3),
    [],
  );

  const recentThreads = useMemo(
    () => FORUM_THREADS.slice(0, 3),
    [],
  );

  return (
    <AppLayout title="Панель управления">
      <div className="container py-4 md:py-6">
        {/* ── Bento Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">

          {/* ═══ Block 1 — Hero / Welcome ═══════════════════════
              Spans 2 columns on desktop for visual weight. */}
          <BentoCard className="md:col-span-2 lg:col-span-2">
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/15 text-primary font-bold text-lg">
                      {MOCK_USER.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-lg font-bold text-foreground md:text-xl">
                      Привет, {MOCK_USER.name.split(" ")[0]}!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {MOCK_USER.group} · {MOCK_USER.email}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="hidden md:inline-flex">
                  <Sparkles className="size-3" data-icon="inline-start" />
                  Карма: {MOCK_USER.karma}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatPill icon={ShoppingBag} label="Объявления" value={MOCK_USER.listingsCount} />
                <StatPill icon={TrendingUp} label="Рейтинг" value={`${MOCK_USER.rating} ★`} />
                <StatPill icon={Eye} label="Просмотры" value="1.2K" />
                <StatPill icon={MessageSquare} label="Отзывы" value={MOCK_USER.reviewCount} />
              </div>
            </div>
          </BentoCard>

          {/* ═══ Block 2 — Quick Actions ═══════════════════════ */}
          <BentoCard className="lg:col-span-1">
            <div className="flex flex-col gap-3 p-5 md:p-6 h-full">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold">Быстрые действия</CardTitle>
                <CardDescription>Создайте или найдите</CardDescription>
              </CardHeader>
              <div className="flex flex-col gap-2 flex-1 justify-center">
                <Link href="/create">
                  <Button className="w-full justify-start gap-2 rounded-lg" size="default">
                    <PlusCircle data-icon="inline-start" />
                    Новое объявление
                  </Button>
                </Link>
                <Link href="/create">
                  <Button variant="outline" className="w-full justify-start gap-2 rounded-lg" size="default">
                    <AlertTriangle data-icon="inline-start" />
                    Сообщить о потере
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full justify-start gap-2 rounded-lg" size="default">
                    <Search data-icon="inline-start" />
                    Поиск по объявлениям
                  </Button>
                </Link>
              </div>
            </div>
          </BentoCard>

          {/* ═══ Block 3 — Trending Marketplace ════════════════
              Spans 2 columns on desktop. */}
          <BentoCard className="md:col-span-2 lg:col-span-2">
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex items-center justify-between">
                <CardHeader className="p-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    Популярное
                  </CardTitle>
                  <CardDescription>Самые просматриваемые объявления</CardDescription>
                </CardHeader>
                <Link href="/marketplace">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Все
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {trendingItems.map((item, i) => (
                  <Link key={item.id} href={`/listing/${item.id}`}>
                    <div
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-lg border border-border/40 bg-background/50 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 ck-animate-in",
                      )}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {item.images[0] && (
                        <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className={cn("ck-badge-" + item.type, "self-start")}>
                          {getTypeLabel(item.type)}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          {item.price ? (
                            <span className="ck-price text-sm">{formatPrice(item.price)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Без цены</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="size-3" />
                            {item.views}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* ═══ Block 4 — Forum Preview ═══════════════════════ */}
          <BentoCard className="lg:col-span-1">
            <div className="flex flex-col gap-4 p-5 md:p-6 h-full">
              <div className="flex items-center justify-between">
                <CardHeader className="p-0">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MessageSquare className="size-4 text-primary" />
                    Форум
                  </CardTitle>
                  <CardDescription>Активные обсуждения</CardDescription>
                </CardHeader>
                <Link href="/forum">
                  <Button variant="ghost" size="sm" className="text-primary">
                    Все
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {recentThreads.map((thread, i) => (
                  <Link key={thread.id} href="/forum">
                    <div
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg border border-border/40 bg-background/50 p-3 transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 ck-animate-in",
                      )}
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-start gap-2">
                        {thread.pinned && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                            📌
                          </Badge>
                        )}
                        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                          {thread.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{thread.author.name}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          {thread.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {thread.lastActivity}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </AppLayout>
  );
}
