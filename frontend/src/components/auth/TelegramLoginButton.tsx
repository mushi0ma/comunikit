/* comunikit — Telegram Login Widget button (custom UI)
 *
 * Loads the official widget script headlessly to get access to the
 * `Telegram.Login.auth()` popup API, then renders a fully custom dark
 * button (styled like "Continue with GitHub"). Clicking it opens the
 * Telegram OAuth popup; the signed payload is forwarded to the backend
 * via POST /api/auth/telegram-login with credentials: 'include'.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001");

const BOT_USERNAME =
  (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) ?? "";

const BOT_ID =
  (import.meta.env.VITE_TELEGRAM_BOT_ID as string | undefined) ?? "";

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

/* Telegram's widget script exposes this global */
interface TelegramGlobal {
  Login: {
    auth: (
      options: { bot_id: string; request_access?: boolean; lang?: string },
      callback: (data: TelegramWidgetPayload | false) => void,
    ) => void;
  };
}

type WindowWithTelegram = typeof window & { Telegram?: TelegramGlobal };

/** Resolve the numeric bot_id from BOT_USERNAME via the widget script. */
let scriptLoaded = false;

function ensureWidgetScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src*="telegram.org/js/telegram-widget"]',
    );
    if (existing) {
      scriptLoaded = true;
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-widget.js?22";
    s.async = true;
    s.setAttribute("data-telegram-login", BOT_USERNAME);
    s.setAttribute("data-size", "large");
    s.setAttribute("data-request-access", "write");
    s.setAttribute("data-userpic", "false");
    // Use a throw-away callback so the script initialises Telegram.Login
    s.setAttribute("data-onauth", "__ck_tg_noop(user)");
    (window as unknown as Record<string, unknown>).__ck_tg_noop = () => {};
    s.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    // Mount in a hidden container so the iframe doesn't show
    let ghost = document.getElementById("__ck_tg_ghost");
    if (!ghost) {
      ghost = document.createElement("div");
      ghost.id = "__ck_tg_ghost";
      ghost.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;overflow:hidden;pointer-events:none";
      document.body.appendChild(ghost);
    }
    ghost.appendChild(s);
  });
}

export default function TelegramLoginButton({
  onSuccess,
  className,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(scriptLoaded);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!BOT_USERNAME) return;
    ensureWidgetScript().then(() => setScriptReady(true));
  }, []);

  const sendPayload = useCallback(
    async (user: TelegramWidgetPayload) => {
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
        onSuccessRef.current();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Ошибка входа через Telegram",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  function handleClick() {
    const tg = (window as WindowWithTelegram).Telegram;
    if (!tg?.Login?.auth) {
      toast.error("Telegram widget не загружен, попробуйте позже");
      return;
    }
    const botId = BOT_ID || BOT_USERNAME;
    if (!botId) {
      toast.error("Telegram bot не настроен");
      return;
    }
    tg.Login.auth(
      { bot_id: botId, request_access: true },
      (data) => {
        if (!data) return; // user closed the popup
        sendPayload(data);
      },
    );
  }

  // Fallback UI when the bot username env var is missing (dev without config).
  if (!BOT_USERNAME) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 transition-colors",
          className,
        )}
      >
        <Send className="size-4 text-sky-500/40" />
        telegram not configured
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || loading || !scriptReady}
      onClick={handleClick}
      className={cn(
        "group relative flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] font-mono text-xs uppercase tracking-[0.15em] text-foreground backdrop-blur-sm transition-all duration-200",
        "hover:border-[#2AABEE]/40 hover:bg-[#2AABEE]/[0.06] hover:text-[#2AABEE]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2AABEE]/50",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin text-[#2AABEE]" />
          <span className="text-zinc-400">signing in…</span>
        </>
      ) : (
        <>
          <Send className="size-4 text-[#2AABEE] transition-transform duration-200 group-hover:translate-x-0.5" />
          Telegram
        </>
      )}
    </button>
  );
}
