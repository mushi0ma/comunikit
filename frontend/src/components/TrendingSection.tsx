/* comunikit — TrendingSection (desktop side column)
   Shows trending forum threads, quick actions, and community stats.
*/
import { TrendingUp, Plus, MapPin } from "lucide-react";
import { useLocation } from "wouter";
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
                onClick={() => navigate("/forum")}
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
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/create")}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-3" /> Добавить
          </button>
          <button
            onClick={() => navigate("/map")}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <MapPin className="size-3" /> Карта
          </button>
        </div>
      </div>
    </div>
  );
}
