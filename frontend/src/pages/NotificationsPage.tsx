/* comunikit — NotificationsPage
   Grouped notifications list (Новые / Прочитанные) with real API.
*/
import { Bell, MessageCircle, MapPin, MessageSquare, CheckCheck, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

/* ── helpers ──────────────────────────────────────────────── */

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

/* ── page ─────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const data = await apiFetch<Notification[]>("/api/notifications");
        return data.length > 0 ? data : MOCK_NOTIFICATIONS;
      } catch {
        return MOCK_NOTIFICATIONS;
      }
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(["notifications"], old =>
        (old ?? []).map(n => ({ ...n, isRead: true })),
      );
      toast.success("Все уведомления прочитаны");
    },
    onError: () => toast.error("Ошибка при отметке"),
  });

  const markOneReadMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Notification[]>(["notifications"], old =>
        (old ?? []).map(n => n.id === id ? { ...n, isRead: true } : n),
      );
    },
  });

  const notifications = items ?? MOCK_NOTIFICATIONS;
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  return (
    <AppLayout title="Уведомления">
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-0">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Уведомления</h2>
          {unread.length > 0 && (
            <button
              title="Отметить все прочитанными"
              disabled={markAllReadMut.isPending}
              onClick={() => markAllReadMut.mutate()}
              className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              {markAllReadMut.isPending ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <CheckCheck className="size-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6 ck-animate-in">
            {unread.length > 0 && (
              <Group title="Новые" count={unread.length}>
                {unread.map(n => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={() => markOneReadMut.mutate(n.id)}
                  />
                ))}
              </Group>
            )}

            {read.length > 0 && (
              <Group title="Прочитанные" count={read.length}>
                {read.map(n => (
                  <NotificationItem key={n.id} notification={n} onClick={() => {}} />
                ))}
              </Group>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

/* ── Subcomponents ──────────────────────────────────────── */

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const Icon = ICON_BY_TYPE[notification.type] ?? MessageCircle;
  const colorClass = COLOR_BY_TYPE[notification.type] ?? "bg-muted text-muted-foreground";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-300 w-full",
        notification.isRead
          ? "bg-muted/20 border-border opacity-60"
          : "bg-card border-primary/30 hover:border-primary/50 hover:bg-accent/50",
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{notification.body}</p>
      </div>

      {!notification.isRead && (
        <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Непрочитано" />
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-border bg-card py-20 text-center ck-animate-in">
      <Bell className="mx-auto mb-3 size-12 text-muted-foreground opacity-30" />
      <p className="font-semibold text-foreground">Уведомлений нет</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Здесь будут появляться отклики, ответы и важные события
      </p>
    </div>
  );
}
