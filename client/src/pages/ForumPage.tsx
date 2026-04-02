/* comunikit — ForumPage
   Design: "Digital Bazaar" — category tabs, thread list, create thread CTA
*/
import { useState } from "react";
import { MessageSquare, Pin, Plus, ChevronRight, Clock, Hash, Globe, BookOpen, MessageCircle, CalendarDays, Home as HomeIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { FORUM_THREADS } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FORUM_CATEGORIES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "all", label: "Все", Icon: Globe },
  { value: "Учёба", label: "Учёба", Icon: BookOpen },
  { value: "Общее", label: "Общее", Icon: MessageCircle },
  { value: "События", label: "События", Icon: CalendarDays },
  { value: "Жильё", label: "Жильё", Icon: HomeIcon },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Учёба": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Общее": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "События": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Жильё": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ForumPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = FORUM_THREADS.filter(t =>
    activeCategory === "all" || t.category === activeCategory
  );

  return (
    <AppLayout title="Форум">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
              Обсуждения
            </h2>
            <p className="text-sm text-muted-foreground">{filtered.length} тем · студенческий форум AITUC</p>
          </div>
          <Button
            onClick={() => toast.info("Создание темы в разработке")}
            className="gap-2 text-sm"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
          >
            <Plus className="w-4 h-4" /> Создать тему
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {FORUM_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all",
                activeCategory === cat.value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              <cat.Icon className="w-3.5 h-3.5 shrink-0" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="space-y-2">
          {filtered.map(thread => (
            <div
              key={thread.id}
              onClick={() => toast.info("Просмотр темы в разработке")}
              className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/50 transition-all group ck-animate-in"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  {thread.pinned ? <Pin className="w-4 h-4 text-primary" /> : <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {thread.pinned && (
                          <span className="text-xs font-bold text-primary flex items-center gap-0.5">
                            <Pin className="w-3 h-3" /> Закреплено
                          </span>
                        )}
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", CATEGORY_COLORS[thread.category] || "bg-muted text-muted-foreground")}>
                          {(() => { const cat = FORUM_CATEGORIES.find(c => c.value === thread.category); return cat ? <cat.Icon className="w-3 h-3 inline mr-1" /> : null; })()}
                          {thread.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {thread.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                        {thread.author.name[0]}
                      </div>
                      <span className="text-xs text-muted-foreground">{thread.author.name} · {thread.author.group}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />{thread.replies} ответов
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{thread.lastActivity}
                    </span>
                  </div>

                  {/* Tags */}
                  {thread.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {thread.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-0.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Hash className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Нет тем в этой категории</p>
            <Button className="mt-4" onClick={() => toast.info("Создание темы в разработке")}>
              Создать первую тему
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
