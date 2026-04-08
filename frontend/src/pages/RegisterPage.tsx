/* comunikit — RegisterPage (Two-column, AITU-themed) */
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
  MessageSquare,
  ShoppingBag,
  MapPin,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  Users,
  Zap,
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

const registerSchema = z.object({
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

/* ── Steps for right panel ────────────────────────────────────── */

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Форум студентов",
    desc: "Обсуждай учёбу и жизнь в кампусе",
    gradient: "from-violet-500/20 to-purple-600/20",
    glow: "shadow-violet-500/10",
  },
  {
    icon: ShoppingBag,
    title: "Маркетплейс",
    desc: "Покупай и продавай внутри AITU",
    gradient: "from-sky-500/20 to-blue-600/20",
    glow: "shadow-sky-500/10",
  },
  {
    icon: MapPin,
    title: "Lost & Found",
    desc: "Найди потерянные вещи на карте",
    gradient: "from-emerald-500/20 to-green-600/20",
    glow: "shadow-emerald-500/10",
  },
];

const STATS = [
  { value: "847+", label: "студентов" },
  { value: "1.2K", label: "объявлений" },
  { value: "99%", label: "uptime" },
];

/* ── Component ───────────────────────────────────────────────── */

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const signUp = useAuthStore((s) => s.signUp);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function onSubmit(data: RegisterValues) {
    try {
      await signUp(data.email, data.password, "", data.name);
      toast.success("Аккаунт создан! Добро пожаловать в comunikit");
      navigate("/forum");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка регистрации");
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
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Войти
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
                🎓 Только для студентов AITU
              </span>
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Создать аккаунт
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Присоединяйся к студенческому сообществу
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
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Полное имя
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Алиев Арман"
                      autoComplete="name"
                      className={cn(
                        "pl-10 bg-background border-border",
                        errors.name &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      {...register("name")}
                    />
                  </div>
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
                  <Label htmlFor="password" className="text-sm font-medium">
                    Пароль
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? "text" : "password"}
                      placeholder="Минимум 8 символов"
                      autoComplete="new-password"
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
                      aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
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
                      Создаём аккаунт...
                    </>
                  ) : (
                    "Продолжить"
                  )}
                </Button>
              </form>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Войти
              </Link>
            </p>
          </div>

          {/* ── Right column: premium hero (desktop only) ─────── */}
          <div className="hidden lg:flex flex-col gap-6">
            {/* Gradient accent card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
              {/* Background glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="size-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Comunikit Platform</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2 leading-tight">
                  Всё для студенческой
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-400 to-sky-400 bg-clip-text text-transparent">
                    жизни в AITU
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Единая платформа для общения, торговли и поиска вещей в кампусе.
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                  {STATS.map((s, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature cards with animation */}
            <div className="flex flex-col gap-3">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all duration-500",
                    activeStep === i
                      ? "bg-accent/50 border-primary/30 shadow-lg"
                      : "bg-card/50 border-border/50 hover:bg-accent/30",
                    activeStep === i && feature.glow,
                  )}
                >
                  <div
                    className={cn(
                      "size-11 rounded-xl flex items-center justify-center transition-all duration-500 bg-gradient-to-br",
                      activeStep === i ? feature.gradient : "from-muted to-muted",
                    )}
                  >
                    <feature.icon
                      className={cn(
                        "size-5 transition-colors duration-500",
                        activeStep === i
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold transition-colors duration-500",
                        activeStep === i
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {feature.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "size-2 rounded-full transition-all duration-500",
                      activeStep === i ? "bg-primary scale-100" : "bg-muted scale-75",
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 px-4">
              <div className="flex -space-x-2">
                {["А", "Б", "В", "Г"].map((letter, i) => (
                  <div
                    key={i}
                    className="size-8 rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">+ 847</strong> студентов уже с нами
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
