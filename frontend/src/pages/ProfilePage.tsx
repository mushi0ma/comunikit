/* comunikit — ProfilePage
   Design: RunPod settings pattern — profile header card, tabbed sections
   Features: profile editing, settings inline, email verification, theme
*/
import { useState, useEffect } from "react";
import {
  Star, LogOut, Edit3, Package, ShieldCheck, ChevronRight,
  Moon, Sun, Monitor, Camera, Loader2, Mail, Lock, Bell,
  CheckCircle, Send as SendIcon, Github,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";

type Tab = "listings" | "settings";

const TABS: { value: Tab; label: string }[] = [
  { value: "listings", label: "Мои объявления" },
  { value: "settings", label: "Настройки" },
];

/* ── Profile types ──────────────────────────────────────────────── */

interface MeProfile {
  id: string;
  name: string;
  email: string | null;
  emailVerified: string | null;
  bio: string | null;
  avatarUrl: string | null;
  telegramHandle: string | null;
  group: string | null;
  karma: number;
  studentId: string | null;
  isStudentVerified: boolean;
  hasPassword: boolean;
  createdAt: string;
}

/** Detect fake email addresses issued to Telegram/OAuth users. */
function isSyntheticTelegramEmail(email: string | null): boolean {
  if (!email) return true;
  return email.endsWith("@telegram.comunikit.local");
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("listings");
  const [, navigate] = useLocation();
  const user = useAuthStore(s => s.user);
  const refreshUser = useAuthStore(s => s.refreshUser);
  const signOut = useAuthStore(s => s.signOut);
  const queryClient = useQueryClient();

  /* ── Backend profile (source of truth) ──────────────────── */
  const { data: profile, isLoading: profileLoading } = useQuery<MeProfile>({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<MeProfile>("/api/users/me"),
    enabled: !!user?.id,
  });

  const displayName =
    profile?.name || (user?.user_metadata?.name as string) || "Студент AITU";
  const userGroup = profile?.group || (user?.user_metadata?.group as string) || "";
  const userEmail = profile?.email ?? user?.email ?? "";
  const karma = profile?.karma ?? (user?.user_metadata?.karma as number) ?? 0;
  const isVerified = profile?.isStudentVerified ?? false;

  /* ── My listings query ────────────────────────── */
  const { data: myListings, isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["my-listings", user?.id],
    queryFn: () => apiFetch<Listing[]>(`/api/listings?authorId=${user!.id}`),
    enabled: !!user?.id,
  });

  /* ── Edit modal state ───────────────────────────── */
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editGroup, setEditGroup] = useState(userGroup);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    try {
      await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          group: editGroup.trim(),
        }),
      });
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      await refreshUser();
      toast.success("Профиль обновлён");
      setEditing(false);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Профиль">
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-0">
        {/* ── Profile header card ─────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-16 sm:size-20 rounded-xl">
            <AvatarImage src={profile?.avatarUrl ?? undefined} className="rounded-xl" />
            <AvatarFallback className="rounded-xl bg-primary/10 text-xl sm:text-2xl font-black text-primary">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="text-lg sm:text-xl font-bold text-foreground">{displayName}</div>
            {userGroup && (
              <div className="mt-0.5 font-mono text-sm text-muted-foreground">
                {userGroup}
              </div>
            )}
            {userEmail && (
              <div className="mt-0.5 text-xs text-muted-foreground">{userEmail}</div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{myListings?.length ?? 0} объявлений</Badge>
              {(() => (
                <Badge
                  variant="outline"
                  className={cn(
                    karma > 0 ? "text-primary border-primary/30" : karma < 0 ? "text-red-400 border-red-400/30" : ""
                  )}
                >
                  Карма: {karma}
                </Badge>
              ))()}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 self-start"
            onClick={() => {
              setEditName(displayName);
              setEditGroup(userGroup);
              setEditing(true);
            }}
          >
            <Edit3 className="size-3.5" /> Редактировать
          </Button>
        </div>

        {/* ── Verification CTA ─────────────────────────── */}
        {!isVerified && (
          <Link href="/verify-id">
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 cursor-pointer transition-colors hover:bg-amber-500/10">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                <ShieldCheck className="size-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Аккаунт не верифицирован</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Пройдите верификацию студенческого билета, чтобы получить полный доступ
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        )}

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────── */}
        <div className="mt-4">
          {activeTab === "listings" && <ListingsTab listings={myListings ?? []} isLoading={listingsLoading} />}
          {activeTab === "settings" && (
            <SettingsTab
              profile={profile ?? null}
              profileLoading={profileLoading}
              authUser={user}
            />
          )}
        </div>

        {/* ── Logout ────────────────────────────────────── */}
        <Button
          variant="outline"
          className="h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 mt-6"
          onClick={async () => {
            await signOut();
            toast.success("Вы вышли из аккаунта");
            window.location.href = "/login";
          }}
        >
          <LogOut className="size-4" /> Выйти из аккаунта
        </Button>
      </div>

      {/* ── Edit profile modal ──────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-bold text-foreground">Редактировать профиль</h3>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Имя</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Группа</label>
              <Input
                value={editGroup}
                onChange={e => setEditGroup(e.target.value)}
                placeholder="IT-23-A"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                className="flex-1"
                onClick={saveProfile}
                disabled={saving || editName.trim().length === 0}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ── Listings tab ─────────────────────────────────────────── */

function ListingsTab({ listings, isLoading }: { listings: Listing[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground ck-animate-in">
        <Package className="mx-auto mb-3 size-12 opacity-30" />
        <p className="font-semibold">Нет объявлений</p>
        <p className="mt-1 text-sm">Создайте первое объявление</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ck-animate-in lg:grid-cols-3">
      {listings.map(l => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

/* ── Settings tab (merged from SettingsPage) ─────────────── */

function SettingsTab({
  profile,
  profileLoading,
  authUser,
}: {
  profile: MeProfile | null;
  profileLoading: boolean;
  authUser: { user_metadata?: Record<string, unknown>; email?: string } | null;
}) {
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  /* ── Local form state ────── */
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

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
      const url = await uploadImage(file, "avatars");
      setAvatarUrl(url);
      await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: url }),
      });
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      toast.success("Фото профиля обновлено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки фото");
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
    <div className="space-y-0 ck-animate-in">
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

      {/* ── Link real email (Telegram users) ─────────── */}
      {isSyntheticTelegramEmail(profile?.email ?? authUser?.email ?? null) && (
        <LinkEmailSection />
      )}

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
        <SetPasswordSection hasPassword={profile?.hasPassword ?? true} />
        <div className="h-px bg-border my-3" />
        <LinkRow
          Icon={Lock}
          title="Сменить пароль"
          description="Обновите пароль для входа по email"
          onClick={() => navigate("/reset-password")}
        />
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
        </div>
      </Section>
    </div>
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

  if (!email || email.endsWith("@telegram.comunikit.local")) return null;

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

      {showOtpInput && !isVerified && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Код подтверждения отправлен на <strong className="text-foreground">{email}</strong>.
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

/* ── Link Real Email (Telegram users) ────────────────────────── */

function LinkEmailSection() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

  const linkMutation = useMutation({
    mutationFn: (newEmail: string) =>
      apiFetch<{ message: string; email: string }>("/api/auth/link-email", {
        method: "POST",
        body: JSON.stringify({ email: newEmail }),
      }),
    onSuccess: (data) => {
      toast.success(data.message);
      setShowOtpInput(true);
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Ошибка привязки email"),
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
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Неверный код"),
  });

  return (
    <Section title="Привязать реальный Email">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Mail className="size-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Вы вошли через Telegram
          </p>
          <p className="text-xs text-muted-foreground">
            Привяжите реальный email, чтобы получать уведомления и восстанавливать доступ.
          </p>
        </div>
      </div>

      {!showOtpInput ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={linkMutation.isPending}
            autoComplete="email"
          />
          <Button
            size="sm"
            className="self-end"
            disabled={linkMutation.isPending || !/^\S+@\S+\.\S+$/.test(email)}
            onClick={() => linkMutation.mutate(email.trim().toLowerCase())}
          >
            {linkMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Привязать email"
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Код подтверждения отправлен на{" "}
            <strong className="text-foreground">{email}</strong>.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="000000"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
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
              ) : (
                "Подтвердить"
              )}
            </Button>
          </div>
          <button
            className="self-start text-xs text-primary hover:underline"
            onClick={() => linkMutation.mutate(email.trim().toLowerCase())}
            disabled={linkMutation.isPending}
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
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [justSet, setJustSet] = useState(false);

  const setPasswordMutation = useMutation({
    mutationFn: (pwd: string) =>
      apiFetch("/api/users/me/set-password", {
        method: "POST",
        body: JSON.stringify({ password: pwd }),
      }),
    onSuccess: () => {
      toast.success("Пароль установлен!");
      setJustSet(true);
      setShowForm(false);
      setPassword("");
      setConfirmPassword("");
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  if (hasPassword || justSet) return null;

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
