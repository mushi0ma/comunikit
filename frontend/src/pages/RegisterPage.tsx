/* comunikit — RegisterPage (Two-column, AITU-themed) */
import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  Send,
  XCircle,
  Github,
  CreditCard,
  Upload,
  CheckCircle2,
  MessageSquare,
  ShoppingBag,
  MapPin,
  Key,
  Mail,
  Lock,
  User,
  ArrowLeft,
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
  studentId: z
    .string()
    .min(5, "Код доступа должен содержать 5–8 цифр")
    .max(8, "Код доступа должен содержать 5–8 цифр")
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

/* ── Steps for right panel ────────────────────────────────────── */

const STEPS = [
  { icon: MessageSquare, title: "Форум студентов", desc: "Обсуждай учёбу и жизнь в кампусе" },
  { icon: ShoppingBag, title: "Маркетплейс", desc: "Покупай и продавай внутри AITU" },
  { icon: MapPin, title: "Lost & Found", desc: "Найди потерянные вещи на карте" },
];

/* ── Component ───────────────────────────────────────────────── */

type VerifyState = "idle" | "checking" | "valid" | "invalid";

interface IdCardResult {
  valid: boolean;
  name?: string;
  validUntil?: string;
  reason?: string;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [idCardResult, setIdCardResult] = useState<IdCardResult | null>(null);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  async function handleIdCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdCardLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const mimeType = file.type;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/auth/verify-id-card`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, mimeType }),
          },
        );
        const data = (await res.json()) as IdCardResult;
        setIdCardResult(data);
        if (data.valid) toast.success("ID карта верифицирована!");
        else toast.error(data.reason || "Карта не прошла проверку");
      } catch {
        toast.error("Ошибка при проверке карты");
      } finally {
        setIdCardLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(data: RegisterValues) {
    if (verifyState !== "valid") return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/whitelist/check?studentId=${encodeURIComponent(data.studentId)}`,
      );
      const json = await res.json();
      if (!json.data?.valid) {
        toast.error("Код доступа не найден в базе AITUC");
        return;
      }
      await signUp(data.email, data.password, data.studentId, data.name);
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
                {/* Student ID */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="studentId" className="text-sm font-medium">
                    Код доступа
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="studentId"
                      type="text"
                      inputMode="numeric"
                      placeholder="Введите код"
                      autoComplete="off"
                      className={cn(
                        "pl-10 pr-8 font-mono bg-background border-border",
                        verifyState === "invalid" &&
                          "border-destructive focus-visible:ring-destructive",
                        verifyState === "valid" &&
                          "border-green-500 focus-visible:ring-green-500",
                        errors.studentId &&
                          verifyState === "idle" &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                      {...register("studentId", {
                        onBlur: (e) => verifyStudentId(e.target.value),
                      })}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {verifyState === "checking" && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      )}
                      {verifyState === "valid" && (
                        <Check className="size-4 text-green-500" />
                      )}
                      {verifyState === "invalid" && (
                        <XCircle className="size-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {verifyState === "invalid" && (
                    <p className="text-xs text-destructive">
                      Код доступа не найден в базе AITUC
                    </p>
                  )}
                  {errors.studentId && verifyState === "idle" && (
                    <p className="text-xs text-destructive">
                      {errors.studentId.message}
                    </p>
                  )}
                </div>

                {/* ID Card verification (optional) */}
                {verifyState === "valid" && (
                  <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-primary" />
                      <span className="text-sm font-semibold">
                        Верификация ID карты
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Необязательно
                      </span>
                    </div>

                    {!idCardResult ? (
                      <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                        {idCardLoading ? (
                          <Loader2 className="size-6 text-muted-foreground animate-spin" />
                        ) : (
                          <Upload className="size-6 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground text-center">
                          {idCardLoading
                            ? "Проверяем карту..."
                            : "Загрузите фото ID карты AITU для верификации"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={idCardLoading}
                          onChange={handleIdCardUpload}
                        />
                      </label>
                    ) : (
                      <div
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg text-sm",
                          idCardResult.valid
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20",
                        )}
                      >
                        {idCardResult.valid ? (
                          <>
                            <CheckCircle2 className="size-4" />
                            Карта верифицирована · {idCardResult.name}
                          </>
                        ) : (
                          <>
                            <XCircle className="size-4" />
                            {idCardResult.reason || "Не удалось верифицировать"}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                  disabled={isSubmitting || verifyState !== "valid"}
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

          {/* ── Right column: preview (desktop only) ───────────── */}
          <div className="hidden lg:block">
            {/* Mock forum thread preview */}
            <div className="rounded-2xl border border-border bg-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  А
                </div>
                <span className="text-sm font-medium">Алиев Арман</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  2 мин назад
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">
                Как подготовиться к экзамену по алгоритмам?
              </p>
              <p className="text-xs text-muted-foreground">
                Делюсь материалами и стратегией...
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>👍 24</span>
                <span>💬 18 ответов</span>
                <span className="ml-auto text-primary">Учёба</span>
              </div>
            </div>

            {/* Animated steps */}
            <div className="flex flex-col gap-3">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                    activeStep === i
                      ? "bg-accent/50 border-border"
                      : "bg-card/50 border-border/50",
                  )}
                >
                  <div
                    className={cn(
                      "size-9 rounded-lg flex items-center justify-center transition-colors",
                      activeStep === i ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    <step.icon
                      className={cn(
                        "size-4 transition-colors",
                        activeStep === i
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        activeStep === i
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  <div
                    className={cn(
                      "ml-auto size-5 rounded-full flex items-center justify-center transition-all",
                      activeStep === i ? "bg-primary/10" : "bg-transparent",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3 transition-all",
                        activeStep === i
                          ? "text-primary scale-100"
                          : "text-transparent scale-0",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
