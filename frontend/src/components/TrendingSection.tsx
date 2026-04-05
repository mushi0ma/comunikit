/* comunikit — TrendingSection (desktop side column)
   Shows trending forum threads, quick actions, and community stats.
*/
import { TrendingUp, Plus, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { FORUM_THREADS } from "@/lib/mockData";

export default function TrendingSection() {
  const [, navigate] = useLocation();
  const topThreads = FORUM_THREADS.slice(0, 5);

  return (
    <div className="flex flex-col gap-4 sticky top-4">
      {/* Trending */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={2} />
          <h3 className="text-sm font-bold text-foreground">В тренде</h3>
        </div>
        <ul className="flex flex-col gap-3">
          {topThreads.map((thread, i) => (
            <li key={thread.id}>
              <button
                onClick={() => navigate(`/forum/${thread.id}`)}
                className="w-full text-left group"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {thread.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                        {thread.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {thread.replies} ответов
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick actions */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Быстрые действия</h3>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate("/create")}
            className="w-full justify-start gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Добавить объявление
          </Button>
          <Button
            onClick={() => navigate("/map")}
            variant="outline"
            className="w-full justify-start gap-2"
            size="sm"
          >
            <MapPin className="w-4 h-4" />
            Карта потерь
          </Button>
        </div>
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground text-center px-2">
        128 студентов · 43 объявления · 6 тем
      </p>
    </div>
  );
}
