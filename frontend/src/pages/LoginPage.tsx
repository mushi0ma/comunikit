/* comunikit — LoginPage (Two-column, AITU-themed) */
import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { initTelegramWidget } from "@/lib/telegram-auth";

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
  { icon: Shield, text: "Только верифицированные студенты" },
  { icon: MessageSquare, text: "Форум, маркетплейс и Lost & Found" },
  { icon: Star, text: "Карма и рейтинг участников" },
];

/* ── Component ───────────────────────────────────────────────── */

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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

  function handleTelegramAuth() {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      toast.error("Telegram бот не настроен");
      return;
    }

    initTelegramWidget(
      botUsername,
      async (telegramUser) => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/telegram`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(telegramUser),
            },
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.message ?? data.error ?? "Ошибка");
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          toast.success("Добро пожаловать!");
          navigate("/forum");
        } catch (e) {
          toast.error((e as Error).message);
        }
      },
      "telegram-widget-container",
    );

    setTimeout(() => {
      const iframe = document.querySelector(
        "#telegram-widget-container iframe",
      ) as HTMLElement | null;
      iframe?.click();
    }, 500);
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
                <button
                  type="button"
                  onClick={handleTelegramAuth}
                  className="flex items-center justify-center gap-2 h-10 rounded-lg bg-background border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Send className="size-4" />
                  Telegram
                </button>
              </div>

              <div id="telegram-widget-container" className="hidden" />

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
                    <button
                      type="button"
                      onClick={() =>
                        toast.info("Восстановление пароля в разработке")
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      Забыли пароль?
                    </button>
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

          {/* ── Right column: preview (desktop only) ───────────── */}
          <div className="hidden lg:block">
            {/* Stats card */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-6 text-center">
              <p className="text-4xl font-bold text-primary mb-1">847</p>
              <p className="text-sm text-muted-foreground">студентов AITU</p>
            </div>

            {/* Feature bullets */}
            <div className="flex flex-col gap-3">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="size-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
