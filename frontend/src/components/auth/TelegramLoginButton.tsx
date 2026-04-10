/* comunikit — Telegram Login Widget button
 *
 * Injects the official widget script (https://telegram.org/js/telegram-widget.js?22)
 * into a container and registers a global `onTelegramAuth` callback that
 * forwards the signed payload to the backend over a cookie-based session
 * endpoint (POST /api/auth/telegram-login with credentials: 'include').
 *
 * The widget is the only auth entry point for Telegram — the old deep-link
 * bot flow (/login command → /api/auth/telegram-token) has been removed.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3001";

const BOT_USERNAME =
  (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) ?? "";

export interface TelegramWidgetPayload {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  onSuccess: () => void;
  className?: string;
  disabled?: boolean;
}

type GlobalWithCallback = typeof window & {
  [key: string]: ((user: TelegramWidgetPayload) => void) | undefined;
};

export default function TelegramLoginButton({
  onSuccess,
  className,
  disabled,
}: Props) {
  const domId = useId();
  const containerId = `tg-login-${domId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const callbackName = `onTelegramAuth_${domId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!BOT_USERNAME) {
      // eslint-disable-next-line no-console
      console.warn(
        "[TelegramLoginButton] VITE_TELEGRAM_BOT_USERNAME is not set — widget disabled.",
      );
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    // Register a unique global callback — Telegram's widget calls it by name.
    const globalWindow = window as GlobalWithCallback;
    globalWindow[callbackName] = async (user: TelegramWidgetPayload) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/telegram-login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        const body = (await res.json().catch(() => null)) as
          | { success?: boolean; data?: unknown; error?: string }
          | null;
        if (!res.ok || body?.success === false) {
          throw new Error(body?.error ?? "Telegram login failed");
        }
        toast.success("Вход через Telegram выполнен");
        onSuccess();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Ошибка входа через Telegram",
        );
      } finally {
        setLoading(false);
      }
    };

    // Inject the widget script. Telegram reads these data-* attributes from
    // the <script> tag itself and mounts an <iframe> sibling into the parent.
    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    container.appendChild(script);

    return () => {
      delete globalWindow[callbackName];
      container.innerHTML = "";
    };
  }, [callbackName, onSuccess]);

  // Fallback UI when the bot username env var is missing (dev without config).
  if (!BOT_USERNAME) {
    return (
      <div
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground",
          className,
        )}
      >
        <Send className="size-4 text-sky-500/60" />
        telegram not configured
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-11 items-center justify-center",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <div
        id={containerId}
        ref={containerRef}
        aria-label="Telegram login widget"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-4 animate-spin text-sky-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            signing in…
          </span>
        </div>
      )}
    </div>
  );
}
