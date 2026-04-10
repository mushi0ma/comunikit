/* comunikit — RegisterPage (Runpod split layout / cyberpunk) */
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Github,
  Send,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import AuthHero from "@/components/auth/AuthHero";

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

/* ── Component ───────────────────────────────────────────────── */

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

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

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Hero aside (desktop only) — with ASCII image slideshow ── */}
      <AuthHero
        withImages
        heading={
          <>
            Присоединяйся к{" "}
            <span className="text-fuchsia-400">AITU</span>
            <span className="ml-1 inline-block h-7 w-[3px] translate-y-1 animate-pulse bg-fuchsia-400" />
          </>
        }
        subheading="Форум, маркетплейс, Lost & Found — одним аккаунтом."
      />

      {/* ── Form side ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:px-10 lg:py-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              back
            </span>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-[0.15em]"
            >
              sign in →
            </Button>
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
                new.user // register
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Создать аккаунт
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Присоединяйся к студенческому сообществу{" "}
                <span className="font-mono text-foreground">AITU</span>.
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="mb-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleGithubAuth}
                className="group flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card/40 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-accent"
              >
                <Github className="size-4" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                  GitHub
                </span>
              </button>
              <a
                href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME}?start=login`}
                className="group flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card/40 backdrop-blur-sm transition-all hover:border-sky-500/60 hover:bg-accent"
              >
                <Send className="size-4 text-sky-500" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                  Telegram
                </span>
              </a>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                or with email
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Form — Runpod-style minimal inputs */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Алиев Арман"
                  autoComplete="name"
                  {...register("name")}
                  className={cn(
                    "w-full border-0 border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors",
                    errors.name && "border-destructive focus:border-destructive",
                  )}
                />
                {errors.name && (
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    ✗ {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="student@aitu.edu.kz"
                  autoComplete="email"
                  {...register("email")}
                  className={cn(
                    "w-full border-0 border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors",
                    errors.email && "border-destructive focus:border-destructive",
                  )}
                />
                {errors.email && (
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    ✗ {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    {...register("password")}
                    className={cn(
                      "w-full border-0 border-b border-border bg-transparent py-2 pr-8 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors",
                      errors.password &&
                        "border-destructive focus:border-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    ✗ {errors.password.message}
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
                    создаём...
                  </>
                ) : (
                  <>
                    создать аккаунт
                    <span className="ml-2 opacity-70">→</span>
                  </>
                )}
              </Button>
            </form>

            {/* Login link */}
            <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
              уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="uppercase tracking-[0.15em] text-primary hover:underline"
              >
                войти →
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
