/* comunikit — RegisterPage (Split-Screen, RunPod-inspired)
   Left: form on black bg · Right: feature highlights on zinc-900 (desktop only)
*/
import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  Boxes,
  Send,
  XCircle,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { openTelegramAuth } from "@/lib/telegram-auth";

/* ── Validation ──────────────────────────────────────────────── */

const registerSchema = z.object({
  studentId: z
    .string()
    .min(5, "Student ID должен содержать 5–8 цифр")
    .max(8, "Student ID должен содержать 5–8 цифр")
    .regex(/^\d+$/, "Только цифры"),
  name: z.string().min(1, "Введите имя"),
  email: z
    .string()
    .min(1, "Введите email")
    .email("Некорректный email"),
  password: z
    .string()
    .min(1, "Введите пароль")
    .min(8, "Минимум 8 символов"),
});

type RegisterValues = z.infer<typeof registerSchema>;

/* ── Features for right panel ────────────────────────────────── */

const FEATURES = [
  "Покупай и продавай внутри кампуса",
  "Находи потерянные вещи",
  "Общайся на форуме",
];

/* ── Component ───────────────────────────────────────────────── */

type VerifyState = "idle" | "checking" | "valid" | "invalid";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const verifyAbort = useRef<AbortController | null>(null);
  const signUp = useAuthStore((s) => s.signUp);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { studentId: "", name: "", email: "", password: "" },
  });

  async function verifyStudentId(id: string) {
    if (id.length < 5) {
      setVerifyState("idle");
      return;
    }
    verifyAbort.current?.abort();
    verifyAbort.current = new AbortController();
    setVerifyState("checking");
    try {
      const res = await fetch(
        `/api/whitelist/check?studentId=${encodeURIComponent(id)}`,
        { signal: verifyAbort.current.signal },
      );
      const json = await res.json();
      if (json.data?.valid) {
        setVerifyState("valid");
        if (json.data.name) setValue("name", json.data.name);
      } else {
        setVerifyState("invalid");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setVerifyState("idle");
    }
  }

  async function onSubmit(data: RegisterValues) {
    if (verifyState !== "valid") return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/whitelist/check?studentId=${encodeURIComponent(data.studentId)}`,
      );
      const json = await res.json();
      if (!json.data?.valid) {
        toast.error("Student ID не найден в базе AITUC");
        return;
      }
      await signUp(data.email, data.password, data.studentId, data.name);
      toast.success("Аккаунт создан! Добро пожаловать в comunikit");
      navigate("/feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
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
    <div className="min-h-screen bg-black lg:grid lg:grid-cols-2">
      {/* ── Left panel: form ──────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Boxes className="w-7 h-7 text-primary" />
            <span className="text-xl font-black text-foreground">
              comunikit
            </span>
          </div>

          {/* Title block */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Создать аккаунт
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Добро пожаловать в Comunikit! Создайте аккаунт для начала
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGithubAuth}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              Зарегистрироваться через GitHub
            </button>
            <button
              type="button"
              onClick={handleTelegramAuth}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Send className="w-4 h-4" />
              Зарегистрироваться через Telegram
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
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
            {/* Student ID */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId" className="text-sm font-medium">
                Student ID
              </Label>
              <div className="relative">
                <Input
                  id="studentId"
                  type="text"
                  inputMode="numeric"
                  placeholder="12345"
                  autoComplete="off"
                  className={
                    verifyState === "invalid"
                      ? "font-mono border-destructive focus-visible:ring-destructive pr-8"
                      : verifyState === "valid"
                        ? "font-mono border-green-500 focus-visible:ring-green-500 pr-8"
                        : errors.studentId
                          ? "font-mono border-destructive focus-visible:ring-destructive"
                          : "font-mono"
                  }
                  {...register("studentId", {
                    onBlur: (e) => verifyStudentId(e.target.value),
                  })}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {verifyState === "checking" && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {verifyState === "valid" && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {verifyState === "invalid" && (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
              {verifyState === "invalid" && (
                <p className="text-xs text-destructive">
                  Student ID не найден в базе AITUC
                </p>
              )}
              {errors.studentId && verifyState === "idle" && (
                <p className="text-xs text-destructive">
                  {errors.studentId.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Полное имя
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Алиев Арман"
                autoComplete="name"
                className={
                  errors.name
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                className={
                  errors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
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
              className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
              disabled={isSubmitting || verifyState !== "valid"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Создаём аккаунт...
                </>
              ) : (
                "Продолжить"
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline"
            >
              Войти
            </Link>
          </p>

          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground">
            Только для студентов AITU. Ваш Student ID будет проверен.
          </p>
        </div>
      </div>

      {/* ── Right panel: feature highlights (desktop only) ─────── */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12">
        {/* Top: logo + tagline */}
        <div>
          <div className="text-2xl font-black text-foreground">comunikit</div>
          <div className="text-muted-foreground mt-1">
            Маркетплейс студентов AITU
          </div>
        </div>

        {/* Middle: feature highlights */}
        <div className="flex flex-col gap-4">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="size-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        {/* Bottom: social proof */}
        <div className="text-xs text-muted-foreground">
          Уже 500+ студентов AITU
        </div>
      </div>
    </div>
  );
}
