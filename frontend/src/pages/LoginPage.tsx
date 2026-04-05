/* comunikit — LoginPage v3
   RunPod-inspired: pure black bg, single centered dark card,
   OAuth row, divider, email+password form, fuchsia CTA.
*/
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Boxes,
  Github,
  Send,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { openTelegramAuth } from "@/lib/telegram-auth";

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
      navigate("/feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка входа");
    }
  }

  async function handleGithubAuth() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/feed` },
    });
    if (error) toast.error(error.message);
  }

  async function handleTelegramAuth() {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      toast.error("Telegram бот не настроен");
      return;
    }
    openTelegramAuth(botUsername, async (telegramUser) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/telegram`,
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
        navigate("/feed");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* ── Card ──────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Boxes className="w-8 h-8 text-primary" />
          </div>

          {/* Title block */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">
              Войти в Comunikit
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Добро пожаловать! Войдите чтобы продолжить
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGithubAuth}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </button>
            <button
              type="button"
              onClick={handleTelegramAuth}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Send className="w-4 h-4" />
              Telegram
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
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
              <Input
                id="email"
                type="email"
                placeholder="student@aitu.edu.kz"
                autoComplete="email"
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
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
                  onClick={() => toast.info("Восстановление пароля в разработке")}
                  className="text-xs text-primary hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={
                    errors.password
                      ? "border-destructive focus-visible:ring-destructive pr-10"
                      : "pr-10"
                  }
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* CTA */}
            <Button
              type="submit"
              className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Входим...
                </>
              ) : (
                <>
                  Продолжить
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Register link — outside card */}
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
    </div>
  );
}
