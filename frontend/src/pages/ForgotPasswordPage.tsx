/* comunikit — ForgotPasswordPage */
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
  Lock,
  MailWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const TIPS = [
  { icon: MailWarning, text: "Проверь папку Спам если письмо не пришло" },
  { icon: Clock, text: "Ссылка действует 1 час" },
  { icon: Lock, text: "После сброса войди с новым паролем" },
];

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link
          href="/login"
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-base font-bold text-foreground">comunikit</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column: form */}
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            {isSuccess ? (
              /* Success state */
              <div className="text-center">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-500/10 mb-6">
                  <CheckCircle className="size-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Проверь почту
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Письмо отправлено на{" "}
                  <strong className="text-foreground">{email}</strong>.
                  Проверь почту.
                </p>
                <Link href="/login">
                  <Button className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90">
                    <ArrowLeft className="size-4 mr-2" />
                    Вернуться ко входу
                  </Button>
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                  <ArrowLeft className="size-4" />
                  Назад ко входу
                </Link>

                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Восстановить пароль
                </h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Введи email и мы отправим ссылку для сброса
                </p>

                {/* Form card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4"
                  >
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-background border-border"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        "Отправить ссылку"
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Вспомнили пароль?{" "}
                    <Link
                      href="/login"
                      className="text-primary font-semibold hover:underline"
                    >
                      Войти
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right column: tips (desktop only) */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-border bg-card p-6 mb-6 text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                Сброс пароля
              </p>
              <p className="text-sm text-muted-foreground">
                Следуй инструкциям ниже
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <tip.icon className="size-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
