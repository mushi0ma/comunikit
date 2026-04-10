/* comunikit — LoginPage (Two-column, AITU-themed) */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Github,
  Send,
  Mail,
  Lock,
  ArrowLeft,
  Shield,
  MessageSquare,
  Star,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

/* ── Validation ──────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(1, "Введите пароль")
    .min(6, "Минимум 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

/* ── Features for right panel ────────────────────────────────── */

const FEATURES = [
  { icon: Shield, text: "Только верифицированные студенты", color: "text-emerald-400" },
  { icon: MessageSquare, text: "Форум, маркетплейс и Lost & Found", color: "text-sky-400" },
  { icon: Star, text: "Карма и рейтинг участников", color: "text-amber-400" },
];

const ACTIVITY = [
  { user: "Аслан К.", action: "создал тему", target: "Стипендия весна 2026", time: "2м" },
  { user: "Дана М.", action: "продаёт", target: "MacBook Air M3", time: "15м" },
  { user: "Ерболат Т.", action: "нашёл", target: "AirPods Pro", time: "1ч" },
];

/* ── Component ───────────────────────────────────────────────── */

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [activeActivity, setActiveActivity] = useState(0);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveActivity((prev) => (prev + 1) % ACTIVITY.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  /**
   * Telegram deep-link login: the bot sends users a button linking to
   * `/login?tg_token=xxx`. We intercept that token here, exchange it for a
   * Supabase session on the backend, and hydrate the Supabase client so the
   * rest of the app sees us as authenticated.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("tg_token");
    if (!token) return;

    // Clear the token from the URL immediately so a refresh can't re-use it
    // (and so it never ends up in browser history / analytics).
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, document.title, cleanUrl);

    let cancelled = false;
    setTelegramLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/telegram-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json().catch(() => null)) as
          | { access_token?: string; refresh_token?: string; error?: string }
          | null;

        if (!res.ok || !data?.access_token || !data.refresh_token) {
          throw new Error(
            data?.error ?? "Не удалось войти через Telegram. Запросите новую ссылку у бота.",
          );
        }

        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        if (error) throw error;

        if (cancelled) return;
        toast.success("Вход через Telegram выполнен");
        navigate("/forum");
      } catch (err) {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : "Ошибка входа через Telegram",
        );
      } finally {
        if (!cancelled) setTelegramLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function onSubmit(data: LoginValues) {
    try {
      await signIn(data.email, data.password);
      navigate("/forum");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    }
  }

  async function handleGithubAuth() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/forum`,
      },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between p-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-base font-bold text-foreground">comunikit</span>
        </Link>
        <Link href="/register">
          <Button variant="ghost" size="sm">
            Регистрация
          </Button>
        </Link>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          {/* ── Left column: form ──────────────────────────────── */}
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-xs text-primary font-medium">
                👋 Добро пожаловать
              </span>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Войти в аккаунт
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Продолжи работу в студенческом сообществе
            </p>

            {/* Form card */}
            <div className="rounded-2xl border border-border bg-card p-6">
              {/* OAuth buttons — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGithubAuth}
                  className="flex items-center justify-center gap-2 h-10 rounded-lg bg-background border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Github className="size-4" />
                  GitHub
                </button>
                <a
                  href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME}?start=login`}
                  className="flex items-center justify-center gap-2 h-10 rounded-lg bg-background border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Send className="size-4" />
                  Telegram
                </a>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  или
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@aitu.edu.kz"
                      autoComplete="email"
                      className={cn(
                        "pl-10 bg-background border-border",
                        errors.email &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Пароль
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Забыли пароль?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        "pl-10 pr-10 bg-background border-border",
                        errors.password &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPass ? "Скрыть пароль" : "Показать пароль"
                      }
                    >
                      {showPass ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
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
                      Входим...
                    </>
                  ) : (
                    "Войти"
                  )}
                </Button>
              </form>
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          {/* ── Right column: premium hero (desktop only) ─────── */}
          <div className="hidden lg:flex flex-col gap-6">
            {/* Hero card with gradient accents */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
              {/* Background decorations */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-sky-500/8 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Comunikit в цифрах
                  </span>
                </div>

                {/* Big stat */}
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-5xl font-black text-foreground tracking-tight">847</span>
                  <div className="flex items-center gap-1 mb-2">
                    <TrendingUp className="size-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">+12%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  студентов AITU уже используют платформу
                </p>

                {/* Mini stat row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "1.2K", label: "объявлений" },
                    { value: "340", label: "тем в форуме" },
                    { value: "56", label: "вещей найдено" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div className="flex flex-col gap-2.5">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className={cn("size-4", feature.color)} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                  <CheckCircle2 className="size-4 text-emerald-400 ml-auto opacity-60" />
                </div>
              ))}
            </div>

            {/* Live activity feed */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Прямо сейчас
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {ACTIVITY.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-all duration-500",
                      activeActivity === i
                        ? "opacity-100 translate-y-0"
                        : "opacity-40 scale-[0.98]",
                    )}
                  >
                    <div className="size-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {item.user[0]}
                    </div>
                    <span className="text-foreground/80 truncate">
                      <strong className="text-foreground">{item.user}</strong>
                      {" "}{item.action}{" "}
                      <span className="text-primary">{item.target}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
