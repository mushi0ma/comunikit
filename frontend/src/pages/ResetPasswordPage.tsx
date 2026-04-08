/* comunikit — ResetPasswordPage (after clicking email reset link) */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

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

  // Loading state — waiting for session from hash
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Проверяем ссылку...</p>
        </div>
      </div>
    );
  }

  // Invalid / expired link
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-destructive/10 mb-6">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Ссылка недействительна
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ссылка недействительна или истекла. Запросите новую ссылку для сброса
            пароля.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90">
              Запросить новую ссылку
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center p-6">
        <Link
          href="/login"
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-base font-bold text-foreground">comunikit</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Новый пароль
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Придумай новый пароль для своего аккаунта
          </p>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Новый пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-background border-border"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Подтвердите пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Повторите пароль"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "pl-10 pr-10 bg-background border-border",
                      confirmPassword &&
                        password !== confirmPassword &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  <p className="text-xs text-destructive">
                    Пароли не совпадают
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Сохраняем...
                  </>
                ) : (
                  "Сохранить пароль"
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
