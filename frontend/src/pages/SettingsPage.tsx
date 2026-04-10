/* comunikit — SettingsPage
   Dedicated settings screen (extracted from ProfilePage settings tab).
   Design: RunPod-style two-column form cards on desktop.
   Features: profile editing (PATCH /api/users/me), email verification, set-password for OAuth users.
*/
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Moon, Sun, Monitor, ChevronRight, Github, LogOut, Mail, Shield, Camera, Loader2,
  Smartphone, Tablet, X, CheckCircle, Lock, Send as SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/upload";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { SessionInfo } from "../../../shared/types";

/* ── Profile types ──────────────────────────────────────────────── */

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  emailVerified: string | null;
  bio: string | null;
  avatarUrl: string | null;
  telegramHandle: string | null;
  karma: number;
  studentId: string;
  hasPassword: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  /* ── Profile data from backend ──────────────────────── */
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<UserProfile>("/api/users/me"),
  });

  /* ── Local form state (initialized from profile) ────── */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBio(profile.bio || "");
      setTelegram(profile.telegramHandle || "");
      setAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  /* ── Save profile mutation ──────────────────────────── */
  const saveProfileMutation = useMutation({
    mutationFn: (data: { name?: string; bio?: string; telegramHandle?: string }) =>
      apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      toast.success("Профиль сохранён");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  function handleSaveProfile() {
    saveProfileMutation.mutate({
      name: name.trim(),
      bio: bio.trim(),
      telegramHandle: telegram.trim(),
    });
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const url = await uploadImage(file, "avatars", user?.id);
      setAvatarUrl(url);
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      toast.success("Фото профиля обновлено");
    } catch {
      toast.error("Ошибка загрузки фото");
    } finally {
      setAvatarUploading(false);
    }
  };

  const themeOptions = [
    { value: "dark", label: "Тёмная", Icon: Moon },
    { value: "light", label: "Светлая", Icon: Sun },
    { value: "system", label: "Системная", Icon: Monitor },
  ] as const;

  const displayName = profile?.name || (authUser?.user_metadata?.name as string) || "Студент";

  return (
    <AppLayout title="Настройки">
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-0">
        {/* ── Профиль ────────────────────────────────────── */}
        <Section title="Профиль">
          <FormRow label="Аватар">
            <label className="relative cursor-pointer group inline-block">
              <Avatar className="size-16 rounded-xl">
                <AvatarImage src={avatarUrl ?? undefined} className="rounded-xl object-cover" />
                <AvatarFallback className="rounded-xl bg-primary/10 text-xl font-black text-primary">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                {avatarUploading
                  ? <Loader2 className="size-5 text-white animate-spin" />
                  : <Camera className="size-5 text-white" />
                }
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => void handleAvatarUpload(e)}
              />
            </label>
          </FormRow>

          <FormRow label="Имя">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              disabled={profileLoading}
            />
          </FormRow>

          <FormRow label="Bio">
            <Input
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажите о себе"
              disabled={profileLoading}
            />
          </FormRow>

          <FormRow label="Telegram">
            <Input
              placeholder="@username"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              disabled={profileLoading}
            />
          </FormRow>

          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={saveProfileMutation.isPending || profileLoading}
            >
              {saveProfileMutation.isPending ? (
                <><Loader2 className="size-4 mr-1 animate-spin" /> Сохранение...</>
              ) : "Сохранить"}
            </Button>
          </div>
        </Section>

        {/* ── Почта и верификация ────────────────────────── */}
        <EmailVerificationSection
          email={profile?.email ?? authUser?.email ?? null}
          emailVerified={profile?.emailVerified ?? null}
        />

        {/* ── Внешний вид ────────────────────────────────── */}
        <Section title="Внешний вид">
          <FormRow label="Тема интерфейса">
            <div className="flex gap-2">
              {themeOptions.map(opt => {
                const isActive =
                  (opt.value === "dark" && theme === "dark") ||
                  (opt.value === "light" && theme === "light");
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (opt.value === "system") {
                        toast.info("Системная тема в разработке");
                        return;
                      }
                      if (theme !== opt.value && toggleTheme) toggleTheme();
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    <opt.Icon className="size-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FormRow>
        </Section>

        {/* ── Уведомления ────────────────────────────────── */}
        <Section title="Уведомления">
          <ToggleRow
            Icon={Bell}
            title="Push-уведомления"
            description="Новые сообщения, ответы, отклики"
            checked={pushEnabled}
            onChange={setPushEnabled}
          />
          <div className="h-px bg-border my-3" />
          <ToggleRow
            Icon={Mail}
            title="Email-уведомления"
            description="Еженедельный дайджест на почту"
            checked={emailEnabled}
            onChange={setEmailEnabled}
          />
        </Section>

        {/* ── Безопасность ───────────────────────────────── */}
        <Section title="Безопасность">
          {/* Set password for OAuth users */}
          <SetPasswordSection hasPassword={profile?.hasPassword ?? true} />

          <div className="h-px bg-border my-3" />

          <LinkRow
            Icon={Shield}
            title="Сменить пароль"
            description="Обновите пароль для входа по email"
            onClick={() => navigate("/reset-password")}
          />
          <div className="h-px bg-border my-3" />
          <SessionsList />
        </Section>

        {/* ── О приложении ───────────────────────────────── */}
        <Section title="О приложении">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Версия</span>
              <span className="font-mono text-foreground">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Сборка</span>
              <span className="font-mono text-foreground">2026.04</span>
            </div>
            <div className="h-px bg-border my-2" />
            <a
              href="https://github.com/mushi0ma/comunikit"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between py-2 text-foreground transition-colors hover:text-primary"
            >
              <span className="flex items-center gap-2">
                <Github className="size-4" /> GitHub репозиторий
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Карта кампуса — спасибо проекту{" "}
              <a
                href="https://github.com/Yuujiso/aitumap"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                aitumap
              </a>{" "}
              от Yuujiso.
            </p>
          </div>
        </Section>

        {/* ── Logout ─────────────────────────────────────── */}
        <Button
          variant="outline"
          className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
          onClick={() => {
            toast.success("Вы вышли из аккаунта");
            window.location.href = "/login";
          }}
        >
          <LogOut className="size-4" /> Выйти из аккаунта
        </Button>
      </div>
    </AppLayout>
  );
}

/* ── Email Verification Section ──────────────────────────────── */

function EmailVerificationSection({
  email,
  emailVerified,
}: {
  email: string | null;
  emailVerified: string | null;
}) {
  const queryClient = useQueryClient();
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  const sendCodeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/api/auth/send-verification", { method: "POST" }),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowOtpInput(true);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка отправки кода"),
  });

  const verifyMutation = useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ message: string }>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowOtpInput(false);
      setOtpCode("");
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Неверный код"),
  });

  if (!email) return null;

  const isVerified = !!emailVerified;

  return (
    <Section title="Почта">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            isVerified ? "bg-emerald-500/10" : "bg-amber-500/10",
          )}>
            {isVerified
              ? <CheckCircle className="size-5 text-emerald-500" />
              : <Mail className="size-5 text-amber-500" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{email}</p>
            <p className={cn(
              "text-xs",
              isVerified ? "text-emerald-500" : "text-amber-500",
            )}>
              {isVerified ? "✓ Подтверждён" : "Не подтверждён"}
            </p>
          </div>
        </div>

        {!isVerified && !showOtpInput && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/5"
            onClick={() => sendCodeMutation.mutate()}
            disabled={sendCodeMutation.isPending}
          >
            {sendCodeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <><SendIcon className="size-3.5" /> Подтвердить почту</>
            )}
          </Button>
        )}
      </div>

      {/* OTP input */}
      {showOtpInput && !isVerified && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Код подтверждения отправлен на <strong className="text-foreground">{email}</strong>.
            Проверьте почту (или консоль бэкенда).
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="000000"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="max-w-[140px] text-center font-mono text-lg tracking-widest"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => verifyMutation.mutate(otpCode)}
              disabled={otpCode.length !== 6 || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : "Подтвердить"}
            </Button>
          </div>
          <button
            className="text-xs text-primary hover:underline self-start"
            onClick={() => sendCodeMutation.mutate()}
            disabled={sendCodeMutation.isPending}
          >
            Отправить код повторно
          </button>
        </div>
      )}
    </Section>
  );
}

/* ── Set Password Section (for OAuth users) ──────────────────── */

function SetPasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

  const setPasswordMutation = useMutation({
    mutationFn: (pwd: string) =>
      apiFetch("/api/users/me/set-password", {
        method: "POST",
        body: JSON.stringify({ password: pwd }),
      }),
    onSuccess: () => {
      toast.success("Пароль установлен!");
      setShowForm(false);
      setPassword("");
      setConfirmPassword("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  if (hasPassword) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
          <Lock className="size-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Пароль не установлен</p>
          <p className="text-xs text-muted-foreground">
            Вы вошли через соцсеть. Установите пароль, чтобы входить по email.
          </p>
        </div>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/5"
            onClick={() => setShowForm(true)}
          >
            Установить
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Новый пароль</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Повторите пароль</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
            />
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="text-xs text-destructive">Минимум 6 символов</p>
          )}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-destructive">Пароли не совпадают</p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => { setShowForm(false); setPassword(""); setConfirmPassword(""); }}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setPasswordMutation.mutate(password)}
              disabled={
                password.length < 6 ||
                password !== confirmPassword ||
                setPasswordMutation.isPending
              }
            >
              {setPasswordMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : "Установить пароль"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sessions ────────────────────────────────────────────── */

const DEVICE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}

function SessionsList() {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, isError } = useQuery<SessionInfo[]>({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiFetch<SessionInfo[]>("/api/auth/sessions"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/api/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Сеанс завершён");
    },
    onError: () => {
      toast.error("Не удалось завершить сеанс");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !sessions) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Не удалось загрузить сессии
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">
        Активные сессии ({sessions.length})
      </p>
      <div className="flex flex-col gap-2">
        {sessions.map((s) => {
          const DeviceIcon = DEVICE_ICON[s.deviceType] ?? Monitor;
          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                s.isCurrent
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-background",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    s.isCurrent ? "bg-primary/15" : "bg-muted",
                  )}
                >
                  <DeviceIcon
                    className={cn(
                      "size-5",
                      s.isCurrent ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {s.browser} — {s.os}
                    {s.isCurrent && (
                      <span className="ml-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        Текущая
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(s.lastActiveAt)}
                    {s.ip && ` · ${s.ip}`}
                  </p>
                </div>
              </div>

              {!s.isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={revokeMutation.isPending}
                  onClick={() => revokeMutation.mutate(s.id)}
                  title="Завершить сеанс"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Primitives ──────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 border-b border-border pb-3 text-base font-bold text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:grid sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({
  Icon,
  title,
  description,
  checked,
  onChange,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LinkRow({
  Icon,
  title,
  description,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between py-3 text-left first:pt-0 last:pb-0"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
