/* comunikit — ResetPasswordPage (Runpod split layout / cyberpunk) */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  Loader2,
  Eye,
  EyeOff,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import AuthHero from "@/components/auth/AuthHero";

/* ── Component ───────────────────────────────────────────────── */

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const updatePassword = useAuthStore((s) => s.updatePassword);

  useEffect(() => {
    // Supabase processes the hash tokens automatically via onAuthStateChange.
    // Wait briefly for the session to be established from the URL hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setSessionReady(true);
          setSessionChecked(true);
        }
      },
    );

    // Also check if session already exists (e.g. page refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        setSessionChecked(true);
      }
    });

    // Timeout: if no session after 3s, show error
    const timeout = setTimeout(() => {
      setSessionChecked(true);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Пароль должен быть минимум 8 символов");
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      toast.success("Пароль обновлён!");
      setTimeout(() => navigate("/forum"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при сбросе пароля");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading state — waiting for session from hash ─────────
  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 size-8 animate-spin text-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            Проверяем ссылку...
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid / expired link ────────────────────────────────
  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Ссылка недействительна
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ссылка недействительна или истекла. Запросите новую ссылку для сброса
            пароля.
          </p>
          <Link href="/forgot-password">
            <Button className="mt-6 h-11 w-full bg-primary font-mono text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground">
              запросить новую ссылку
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Hero aside (desktop only) ────────────────────────── */}
      <AuthHero
        heading={
          <>
            Новый{" "}
            <span className="text-fuchsia-400">пароль</span>
            <span className="ml-1 inline-block h-7 w-[3px] translate-y-1 animate-pulse bg-fuchsia-400" />
          </>
        }
        subheading="Придумай надёжный пароль для своего аккаунта."
      />

      {/* ── Form side ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center p-6 lg:px-10 lg:py-8">
          <Link
            href="/login"
            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              back
            </span>
          </Link>
        </header>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            {/* Mobile-only mini ASCII logo */}
            <pre
              aria-hidden="true"
              className="mb-8 select-none font-mono text-[9px] leading-[1.1] text-primary lg:hidden"
            >
{` ██████╗██╗  ██╗
██╔════╝██║ ██╔╝
██║     █████╔╝
██║     ██╔═██╗
╚██████╗██║  ██╗
 ╚═════╝╚═╝  ╚═╝`}
            </pre>

            {/* Heading */}
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </span>
                password.reset
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Новый пароль
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Придумай новый пароль для своего аккаунта.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-[11px] text-destructive">
                ✗ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  new password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full border-0 border-b border-border bg-transparent py-2 pr-8 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPass ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Повторите пароль"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full border-0 border-b border-border bg-transparent py-2 pr-8 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50",
                      confirmPassword &&
                        password !== confirmPassword &&
                        "border-destructive focus:border-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showConfirm ? "Скрыть пароль" : "Показать пароль"
                    }
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    ✗ Пароли не совпадают
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-11 bg-primary font-mono text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    сохраняем...
                  </>
                ) : (
                  <>
                    сохранить пароль
                    <span className="ml-2 opacity-70">→</span>
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
