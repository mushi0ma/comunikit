/* comunikit — ForumPage
   Design: RunPod clusters pattern — hero, category feature cards, thread list
*/
import { useState } from "react";
import {
  MessageSquare,
  Pin,
  Plus,
  Clock,
  Hash,
  Globe,
  BookOpen,
  MessageCircle,
  CalendarDays,
  Home as HomeIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { FORUM_THREADS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── category definitions ─────────────────────────────────── */

interface ForumCategory {
  value: string;
  label: string;
  Icon: LucideIcon;
  description: string;
  count: number;
}

const threadCountByCategory = (cat: string) =>
  FORUM_THREADS.filter(t => t.category === cat).length;

const FORUM_CATEGORIES: ForumCategory[] = [
  {
    value: "Учёба",
    label: "Учёба",
    Icon: BookOpen,
    description: "Экзамены, курсы, преподаватели и полезные ресурсы",
    count: threadCountByCategory("Учёба"),
  },
  {
    value: "Общее",
    label: "Общее",
    Icon: MessageCircle,
    description: "Жизнь в кампусе, вопросы, советы и обсуждения",
    count: threadCountByCategory("Общее"),
  },
  {
    value: "События",
    label: "События",
    Icon: CalendarDays,
    description: "Хакатоны, конференции, meetup-ы и мероприятия",
    count: threadCountByCategory("События"),
  },
  {
    value: "Жильё",
    label: "Жильё",
    Icon: HomeIcon,
    description: "Поиск соседей, аренда и вопросы по общежитиям",
    count: threadCountByCategory("Жильё"),
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Учёба": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Общее": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "События": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Жильё": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

/* ── page ─────────────────────────────────────────────────── */

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = FORUM_THREADS.filter(
    t => !activeCategory || t.category === activeCategory,
  );

  return (
    <AppLayout title="Форум">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Форум AITUC
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {FORUM_THREADS.length} тем · студенческое сообщество
          </p>
        </div>

        {/* ── Category feature cards ───────────────────── */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FORUM_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.value;
            return (
              <div
                key={cat.value}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.value)
                }
                className={cn(
                  "cursor-pointer rounded-xl border p-6 transition-colors",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-accent/50",
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <cat.Icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {cat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.count} тем
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Section header + CTA ─────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {activeCategory ?? "Все темы"}
          </h2>
          <Button
            size="sm"
            onClick={() => toast.info("Создание темы в разработке")}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            Новая тема
          </Button>
        </div>

        {/* ── Thread list ──────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {filtered.map(thread => (
            <div
              key={thread.id}
              onClick={() => toast.info("Просмотр темы в разработке")}
              className="group cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50 ck-animate-in"
            >
              {/* title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {thread.pinned && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-primary">
                        <Pin className="size-3" />
                        Закреплено
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        CATEGORY_COLORS[thread.category] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {thread.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                    {thread.title}
                  </h3>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="size-3.5" />
                  {thread.replies}
                </span>
              </div>

              {/* meta row */}
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {thread.author.name[0]}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {thread.author.name}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {thread.lastActivity}
                </span>
                {thread.tags.length > 0 &&
                  thread.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      <Hash className="size-2.5" />
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty state ──────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 size-12 opacity-30" />
            <p className="font-semibold">Нет тем в этой категории</p>
            <Button
              className="mt-4"
              onClick={() =>
                toast.info("Создание темы в разработке")
              }
            >
              Создать первую тему
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
