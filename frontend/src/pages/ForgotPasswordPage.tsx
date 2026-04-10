/* comunikit — ForgotPasswordPage (Runpod split layout / cyberpunk) */
import { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const resetPassword = useAuthStore((s) => s.resetPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Введите корректный email");
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
              back
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
              className="mb-8 select-none font-mono text-[9px] leading-[1.1] text-primary lg:hidden"
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
                  Проверь почту
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Письмо отправлено на{" "}
                  <strong className="font-mono text-foreground">{email}</strong>.
                </p>
                <Link href="/login">
                  <Button className="mt-8 h-11 w-full bg-primary font-mono text-sm font-semibold uppercase tracking-[0.15em] text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30">
                    <ArrowLeft className="mr-2 size-4" />
                    вернуться ко входу
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
                    password.recovery
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Восстановить пароль
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Введи email и мы отправим ссылку для сброса.
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
                      className={cn(
                        "w-full border-0 border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50",
                      )}
                    />
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
                        отправка...
                      </>
                    ) : (
                      <>
                        отправить ссылку
                        <span className="ml-2 opacity-70">→</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Login link */}
                <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
                  вспомнили пароль?{" "}
                  <Link
                    href="/login"
                    className="uppercase tracking-[0.15em] text-primary hover:underline"
                  >
                    войти →
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
