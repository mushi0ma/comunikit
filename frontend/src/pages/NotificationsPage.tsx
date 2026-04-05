/* comunikit — NotificationsPage
   Grouped notifications list (Новые / Прочитанные) with mock data.
*/
import { useState } from "react";
import { Bell, MessageCircle, MapPin, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NotifType = "reply" | "found" | "forum";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "reply",
    title: "Ответ на ваше объявление",
    body: "Алиев А. интересуется MacBook Air",
    time: "5 мин",
    read: false,
  },
  {
    id: "2",
    type: "found",
    title: "Найден предмет рядом с вашей меткой",
    body: "В библиотеке найдены ключи",
    time: "1 ч",
    read: false,
  },
  {
    id: "3",
    type: "forum",
    title: "Новый ответ в теме",
    body: "Как сдать экзамен по алгоритмам",
    time: "2 ч",
    read: true,
  },
];

const ICON_BY_TYPE: Record<NotifType, React.ComponentType<{ className?: string }>> = {
  reply: MessageCircle,
  found: MapPin,
  forum: MessageSquare,
};

const COLOR_BY_TYPE: Record<NotifType, string> = {
  reply: "bg-primary/10 text-primary",
  found: "bg-amber-500/10 text-amber-500",
  forum: "bg-emerald-500/10 text-emerald-500",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unread = items.filter(n => !n.read);
  const read = items.filter(n => n.read);

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Все уведомления прочитаны");
  }

  function dismiss(id: string) {
    setItems(prev => prev.filter(n => n.id !== id));
  }

  return (
    <AppLayout title="Уведомления">
      <div className="mx-auto max-w-2xl px-4 py-6 lg:px-0">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Уведомления</h2>
          {unread.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllRead}>
              <Check className="size-3.5" />
              Отметить все прочитанными
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6 ck-animate-in">
            {unread.length > 0 && (
              <Group title="Новые" count={unread.length}>
                {unread.map(n => (
                  <NotificationItem key={n.id} notification={n} onClick={() => dismiss(n.id)} />
                ))}
              </Group>
            )}

            {read.length > 0 && (
              <Group title="Прочитанные" count={read.length}>
                {read.map(n => (
                  <NotificationItem key={n.id} notification={n} onClick={() => dismiss(n.id)} />
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
  const Icon = ICON_BY_TYPE[notification.type];
  const colorClass = COLOR_BY_TYPE[notification.type];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50",
        !notification.read && "border-primary/30",
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", colorClass)}>
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{notification.time}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{notification.body}</p>
      </div>

      {!notification.read && (
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
