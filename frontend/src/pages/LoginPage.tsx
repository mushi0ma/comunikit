/* comunikit — LoginPage (Runpod split layout / cyberpunk) */
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Github, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import AuthHero from "@/components/auth/AuthHero";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";

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
  const hydrateFromCookie = useAuthStore((s) => s.hydrateFromCookie);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleTelegramSuccess() {
    // The backend just set an HTTP-only session cookie. Pull /auth/me so the
    // store knows we are authenticated — then navigate.
    await hydrateFromCookie();
    navigate("/forum");
  }

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
    <div className="flex min-h-screen bg-background">
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
          <Link href="/register">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-[0.15em]"
            >
              sign up →
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
                authentication required
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Войти
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Продолжи работу в студенческом сообществе{" "}
                <span className="font-mono text-foreground">AITU</span>.
              </p>
            </div>

            {/* OAuth — GitHub + Telegram Login Widget */}
            <div className="mb-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGithubAuth}
                className="group flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card/40 backdrop-blur-sm transition-all hover:border-foreground/40 hover:bg-accent disabled:opacity-50"
              >
                <Github className="size-4" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground">
                  GitHub
                </span>
              </button>
              <TelegramLoginButton onSuccess={handleTelegramSuccess} />
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
                    "w-full border-0 border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50",
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
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                  >
                    password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary hover:underline"
                  >
                    forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className={cn(
                      "w-full border-0 border-b border-border bg-transparent py-2 pr-8 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50",
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
                    вход...
                  </>
                ) : (
                  <>
                    войти
                    <span className="ml-2 opacity-70">→</span>
                  </>
                )}
              </Button>
            </form>

            {/* Register link */}
            <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
              нет аккаунта?{" "}
              <Link
                href="/register"
                className="uppercase tracking-[0.15em] text-primary hover:underline"
              >
                зарегистрироваться →
              </Link>
            </p>
          </motion.div>
        </div>
      </main>

      {/* ── Hero aside (desktop only) ────────────────────────── */}
      <AuthHero />
    </div>
  );
}
