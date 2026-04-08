/* comunikit — NotificationBell
   Popover bell with real unread count, grouped notifications.
   - Loads notifications from DB on mount and polls every 30s.
   - Does NOT mark all as read on open — user must click "Mark all read" explicitly.
   - Supports mark-one-read by clicking individual notifications.
*/
import { Bell, MessageCircle, MapPin, MessageSquare, CheckCheck } from "lucide-react";
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
import { useAuthStore } from "@/store/authStore";

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

/* ── Component ──────────────────────────────────────────────── */

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /* Fetch notifications from DB */
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  /* Mark ALL as read — explicit action via button, NOT on popover open */
  const markAllReadMut = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old ?? []).map((n) => ({ ...n, isRead: true })),
      );
    },
  });

  /* Mark ONE as read — clicking an individual notification */
  const markOneReadMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    },
  });

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);
  const unreadCount = unread.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            <button
              onClick={() => markAllReadMut.mutate()}
              disabled={markAllReadMut.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Прочитать все"
            >
              <CheckCheck className="size-3.5" />
              <span>{unreadCount} новых</span>
            </button>
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
                    <NotifItem
                      key={n.id}
                      notification={n}
                      onClick={() => markOneReadMut.mutate(n.id)}
                    />
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

function NotifItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick?: () => void;
}) {
  const Icon = ICON_BY_TYPE[notification.type] ?? MessageCircle;
  const colorClass = COLOR_BY_TYPE[notification.type] ?? "bg-muted text-muted-foreground";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-start gap-3 px-4 py-2.5 transition-colors",
        notification.isRead ? "opacity-50" : "hover:bg-accent/50",
        onClick && !notification.isRead && "cursor-pointer",
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
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[11px] text-muted-foreground mt-0.5">
          {timeAgo(notification.createdAt)}
        </span>
        {!notification.isRead && (
          <div className="size-2 rounded-full bg-primary" aria-label="Непрочитано" />
        )}
      </div>
    </div>
  );
}
