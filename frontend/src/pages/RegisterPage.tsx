/* comunikit — RegisterPage (Runpod-inspired dark minimal) */
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

function createRegisterSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("auth.validation.enterName")),
    email: z
      .string()
      .min(1, t("auth.validation.enterEmail"))
      .email(t("auth.validation.invalidEmail")),
    password: z
      .string()
      .min(1, t("auth.validation.enterPassword"))
      .min(8, t("auth.validation.minPassword8")),
  });
}

type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

/* ── Shared input class for Runpod-style fields ──────────────── */

const inputBase =
  "w-full rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-white/[0.05] disabled:opacity-40";

const inputError = "border-destructive/40 focus:border-destructive/60 focus:ring-destructive/20";

/* ── Component ───────────────────────────────────────────────── */

export default function RegisterPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);
  const registerSchema = createRegisterSchema(t);
  const hydrateFromCookie = useAuthStore((s) => s.hydrateFromCookie);

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
      toast.success(t("auth.registerSuccess"));
      navigate("/forum");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.registerError"));
    }
  }

  async function handleTelegramSuccess() {
    await hydrateFromCookie();
    navigate("/forum");
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
              {t("common.back")}
            </span>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
            >
              {t("auth.signIn")} →
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
              className="ck-neon-text mb-8 select-none font-mono text-[9px] leading-[1.1] lg:hidden"
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
                {t("auth.registerHint")}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {t("auth.registerTitle")}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {t("auth.registerSubtitle")}{" "}
                <span className="font-mono text-foreground">AITU</span>.
              </p>
            </div>

            {/* OAuth — GitHub + Telegram */}
            <div className="mb-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleGithubAuth}
                className="group flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] font-mono text-xs uppercase tracking-[0.15em] text-foreground backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-50"
              >
                <Github className="size-4" />
                GitHub
              </button>
              <TelegramLoginButton onSuccess={handleTelegramSuccess} />
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
                {t("auth.orWithEmail")}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Form — Runpod-style boxed inputs */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
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
                  className={cn(inputBase, errors.name && inputError)}
                />
                {errors.name && (
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    {errors.name.message}
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
                  className={cn(inputBase, errors.email && inputError)}
                />
                {errors.email && (
                  <p className="mt-0.5 font-mono text-[11px] text-destructive">
                    {errors.email.message}
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
                    className={cn(inputBase, "pr-10", errors.password && inputError)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
                    aria-label={
                      showPass ? t("auth.hidePassword") : t("auth.showPassword")
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
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-11 rounded-lg bg-primary font-mono text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground shadow-[0_0_20px_oklch(0.74_0.238_322.16/25%)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_30px_oklch(0.74_0.238_322.16/35%)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("auth.registerSubmitting")}
                  </>
                ) : (
                  <>
                    {t("auth.registerSubmit")}
                    <span className="ml-2 opacity-60">→</span>
                  </>
                )}
              </Button>
            </form>

            {/* Login link */}
            <p className="mt-8 text-center font-mono text-xs text-muted-foreground/70">
              {t("auth.hasAccount")}{" "}
              <Link
                href="/login"
                className="uppercase tracking-[0.15em] text-primary/80 transition-colors hover:text-primary"
              >
                {t("auth.signIn")} →
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
