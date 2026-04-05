/* comunikit — RegisterPage (Split-Screen, RunPod-inspired)
   Left: form on black bg · Right: feature highlights on zinc-900 (desktop only)
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
  Check,
  Boxes,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { studentId: "", name: "", email: "", password: "" },
  });

  async function onSubmit(_data: RegisterValues) {
    // TODO: replace with real Supabase auth + whitelist check
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Аккаунт создан! Добро пожаловать в comunikit");
    navigate("/feed");
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
              onClick={() => toast.info("Google OAuth в разработке")}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Зарегистрироваться через Google
            </button>
            <button
              type="button"
              onClick={() => toast.info("Telegram OAuth в разработке")}
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
              <Input
                id="studentId"
                type="text"
                inputMode="numeric"
                placeholder="12345"
                autoComplete="off"
                className={
                  errors.studentId
                    ? "font-mono border-destructive focus-visible:ring-destructive"
                    : "font-mono"
                }
                {...register("studentId")}
              />
              {errors.studentId && (
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
              disabled={isSubmitting}
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
