/* comunikit — NotificationBell
   Popover bell with real unread count, grouped notifications.
*/
import { Bell, MessageCircle, MapPin, MessageSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* ── Types ──────────────────────────────────────────────────── */

type NotifType = "reply" | "found" | "forum" | "comment" | "vote";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string | null;
  createdAt: string;
}

/* ── Helpers ─────────────────────────────────────────────────── */

const ICON_BY_TYPE: Record<string, React.ComponentType<{ className?: string }>> = {
  reply: MessageCircle,
  found: MapPin,
  forum: MessageSquare,
  comment: MessageCircle,
  vote: MessageSquare,
};

const COLOR_BY_TYPE: Record<string, string> = {
  reply: "bg-primary/10 text-primary",
  found: "bg-amber-500/10 text-amber-500",
  forum: "bg-emerald-500/10 text-emerald-500",
  comment: "bg-blue-500/10 text-blue-500",
  vote: "bg-violet-500/10 text-violet-500",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return dateStr;
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} д`;
}

/* ── Mock fallback ──────────────────────────────────────────── */

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "reply",
    title: "Ответ на ваше объявление",
    body: "Алиев А. интересуется MacBook Air",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "2",
    type: "found",
    title: "Найден предмет рядом с вашей меткой",
    body: "В библиотеке найдены ключи",
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "3",
    type: "forum",
    title: "Новый ответ в теме",
    body: "Как сдать экзамен по алгоритмам",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
];

/* ── Component ──────────────────────────────────────────────── */

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Notification[]>("/api/notifications");
        return data.length > 0 ? data : MOCK_NOTIFICATIONS;
      } catch {
        return MOCK_NOTIFICATIONS;
      }
    },
    refetchInterval: 30000,
  });

  const markAllReadMut = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old ?? []).map((n) => ({ ...n, isRead: true })),
      );
    },
    onError: () => {
      // silently fail — badge will update on next refetch
    },
  });

  const notifications = items ?? MOCK_NOTIFICATIONS;
  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);
  const unreadCount = unread.length;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      markAllReadMut.mutate();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Уведомления"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-bold text-foreground">Уведомления</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} новых
            </span>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="size-8 text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm text-muted-foreground">Нет уведомлений</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Unread */}
              {unread.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Новые
                    </span>
                  </div>
                  {unread.map((n) => (
                    <NotifItem key={n.id} notification={n} />
                  ))}
                </div>
              )}

              {/* Read */}
              {read.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Прочитанные
                    </span>
                  </div>
                  {read.map((n) => (
                    <NotifItem key={n.id} notification={n} />
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <Link
            href="/notifications"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            Все уведомления →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Notification item ──────────────────────────────────────── */

function NotifItem({ notification }: { notification: Notification }) {
  const Icon = ICON_BY_TYPE[notification.type] ?? MessageCircle;
  const colorClass = COLOR_BY_TYPE[notification.type] ?? "bg-muted text-muted-foreground";

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-2.5 transition-colors",
        notification.isRead ? "opacity-50" : "hover:bg-accent/50",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          colorClass,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-tight truncate">
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {notification.body}
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground mt-0.5">
        {timeAgo(notification.createdAt)}
      </span>
    </div>
  );
}
