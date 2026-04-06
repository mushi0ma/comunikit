/* comunikit — SettingsPage
   Dedicated settings screen (extracted from ProfilePage settings tab).
   Design: RunPod-style two-column form cards on desktop.
*/
import { useState } from "react";
import {
  Bell, Moon, Sun, Monitor, ChevronRight, Github, LogOut, Mail, Shield, Camera, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppLayout from "@/components/AppLayout";
import { MOCK_USER } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/upload";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState(MOCK_USER.name);
  const [telegram, setTelegram] = useState(MOCK_USER.telegramHandle || "");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
                  {MOCK_USER.name[0]}
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
                accept="image/*"
                className="hidden"
                onChange={e => void handleAvatarUpload(e)}
              />
            </label>
          </FormRow>

          <FormRow label="Имя">
            <Input value={name} onChange={e => setName(e.target.value)} />
          </FormRow>

          <FormRow label="Студенческий ID">
            <Input value={MOCK_USER.studentId} readOnly className="font-mono text-muted-foreground" />
          </FormRow>

          <FormRow label="Telegram">
            <Input
              placeholder="@username"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
            />
          </FormRow>

          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={() => toast.success("Профиль сохранён")}>
              Сохранить
            </Button>
          </div>
        </Section>

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
          <div className="flex flex-col divide-y divide-border">
            <LinkRow
              Icon={Shield}
              title="Сменить пароль"
              description="Последняя смена: 3 месяца назад"
              onClick={() => toast.info("Смена пароля в разработке")}
            />
            <LinkRow
              Icon={Shield}
              title="Активные сессии"
              description="2 активных устройства"
              onClick={() => toast.info("Список устройств в разработке")}
            />
          </div>
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
              href="https://github.com/"
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
