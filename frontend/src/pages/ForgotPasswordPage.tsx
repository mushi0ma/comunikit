/* comunikit — ForgotPasswordPage (Runpod split layout / cyberpunk) */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import AuthHero from "@/components/auth/AuthHero";

/* ── Component ───────────────────────────────────────────────── */

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const resetPassword = useAuthStore((s) => s.resetPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError(t("auth.forgotEmailError"));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch {
      // Show success even on error for security (don't reveal if email exists)
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Hero aside (desktop only) ────────────────────────── */}
      <AuthHero
        heading={
          <>
            Восстановление{" "}
            <span className="text-fuchsia-400">доступа</span>
            <span className="ml-1 inline-block h-7 w-[3px] translate-y-1 animate-pulse bg-fuchsia-400" />
          </>
        }
        subheading="Мы отправим ссылку для сброса пароля на твой email."
      />

      {/* ── Form side ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:px-10 lg:py-8">
          <Link
            href="/login"
            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {t("common.back")}
            </span>
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

            {isSuccess ? (
              /* ── Success state ────────────────────────────────── */
              <div className="text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="size-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t("auth.forgotSuccess")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.forgotSent")}{" "}
                  <strong className="font-mono text-foreground">{email}</strong>.
                </p>
                <Link href="/login">
                  <Button
                    className="mt-8 h-11 w-full rounded-lg bg-primary font-mono text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground shadow-[0_0_20px_oklch(0.74_0.238_322.16/25%)] transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_0_30px_oklch(0.74_0.238_322.16/35%)]"
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    {t("auth.forgotBackToLogin")} →
                  </Button>
                </Link>
              </div>
            ) : (
              /* ── Form state ───────────────────────────────────── */
              <>
                {/* Heading */}
                <div className="mb-8">
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                    </span>
                    {t("auth.forgotHint")}
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    {t("auth.forgotTitle")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("auth.forgotSubtitle")}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-[11px] text-destructive">
                    ✗ {error}
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/30 transition-all duration-200 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:bg-white/[0.05] disabled:opacity-40"
                    />
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
                        {t("auth.forgotSubmitting")}
                      </>
                    ) : (
                      <>
                        {t("auth.forgotSubmit")}
                        <span className="ml-2 opacity-70">→</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Login link */}
                <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
                  {t("auth.forgotRemembered")}{" "}
                  <Link
                    href="/login"
                    className="uppercase tracking-[0.15em] text-primary hover:underline"
                  >
                    {t("auth.signIn")} →
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
