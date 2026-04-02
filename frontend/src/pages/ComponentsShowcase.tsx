/* comunikit — ComponentsShowcase
   Design: "Digital Bazaar" — all UI components and variants displayed
*/
import { useState } from "react";
import { Loader2, Check, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ComponentsShowcase() {
  const [switchOn, setSwitchOn] = useState(false);

  return (
    <AppLayout title="UI Компоненты">
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            comunikit Design System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Все компоненты и состояния</p>
        </div>

        {/* Buttons */}
        <Section title="Кнопки">
          <div className="flex flex-wrap gap-3">
            <Button style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button disabled><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Button size="sm" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>+</Button>
          </div>
        </Section>

        {/* Badges */}
        <Section title="Бейджи">
          <div className="flex flex-wrap gap-2">
            <span className="ck-badge-sell">💰 Продажа</span>
            <span className="ck-badge-buy">🛒 Покупка</span>
            <span className="ck-badge-service">🔧 Услуга</span>
            <span className="ck-badge-lost">🔴 Потеряно</span>
            <span className="ck-badge-found">🟢 Найдено</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Активно</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Закрыто</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Черновик</span>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Поля ввода">
          <div className="space-y-3">
            <Input placeholder="Обычный текст" />
            <Input placeholder="С ошибкой" className="border-destructive" />
            <Input placeholder="Успешно" className="border-green-500" />
            <Input placeholder="Отключено" disabled />
            <Textarea placeholder="Многострочное поле..." rows={3} />
            <div className="relative">
              <Input placeholder="Поиск..." className="pl-9" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Карточки">
          <div className="space-y-3">
            {/* Listing card compact */}
            <div className="ck-card p-4">
              <div className="ck-card-stripe bg-primary" />
              <div className="ml-1 flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">📱</div>
                <div className="flex-1">
                  <span className="ck-badge-sell mb-1 inline-block">Продажа</span>
                  <p className="font-bold text-sm text-foreground">iPhone 14 Pro, 256GB</p>
                  <p className="ck-price text-lg mt-0.5">180 000 ₸</p>
                  <p className="text-xs text-muted-foreground">Алиев А. · CS-21-K · 2h ago</p>
                </div>
              </div>
            </div>
            {/* User card */}
            <div className="ck-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-lg">А</div>
                <div>
                  <p className="font-bold text-foreground">Алиев Арман</p>
                  <p className="text-sm text-muted-foreground">CS-21-K · ⭐ 4.8 (12 отзывов)</p>
                </div>
                <Button size="sm" variant="outline" className="ml-auto">Профиль</Button>
              </div>
            </div>
            {/* Comment card */}
            <div className="ck-card p-3">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">С</div>
                <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold">Сейткали Д.</span>
                    <span className="text-xs text-muted-foreground">IT-22-A · 1h ago</span>
                  </div>
                  <p className="text-sm text-foreground/80">Ещё актуально?</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Navigation */}
        <Section title="Навигация">
          <div className="space-y-3">
            {/* Bottom nav preview */}
            <div className="rounded-xl border border-border bg-card p-1">
              <p className="text-xs text-muted-foreground px-3 py-1 mb-1">Bottom Nav (Mobile)</p>
              <div className="flex items-center justify-around py-2 border-t border-border">
                {["🏠 Лента", "🗺️ Карта", "➕ Добавить", "💬 Форум", "👤 Профиль"].map((item, i) => (
                  <div key={item} className={cn("flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg", i === 0 ? "text-primary" : "text-muted-foreground")}>
                    <span className="text-lg">{item.split(" ")[0]}</span>
                    <span className="text-[9px] font-semibold">{item.split(" ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Feedback */}
        <Section title="Обратная связь">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => toast.success("Операция выполнена успешно!")}>Toast Success</Button>
              <Button size="sm" variant="destructive" onClick={() => toast.error("Произошла ошибка!")}>Toast Error</Button>
              <Button size="sm" variant="outline" onClick={() => toast.info("Информационное сообщение")}>Toast Info</Button>
              <Button size="sm" variant="outline" onClick={() => toast.warning("Предупреждение!")}>Toast Warning</Button>
            </div>
            {/* Inline feedback */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">Объявление успешно опубликовано</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">Student ID не найден в базе</p>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-sm text-blue-600 dark:text-blue-400">Только для студентов AITUC</p>
              </div>
            </div>
            {/* Switch */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              <span className="text-sm font-semibold text-foreground">Уведомления {switchOn ? "включены" : "выключены"}</span>
            </div>
            {/* Spinner */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Загрузка данных...</span>
            </div>
          </div>
        </Section>

        {/* Color palette */}
        <Section title="Цветовая палитра">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Primary", bg: "bg-[#F97316]" },
              { label: "Secondary", bg: "bg-[#0EA5E9]" },
              { label: "Lost", bg: "bg-[#EF4444]" },
              { label: "Found", bg: "bg-[#22C55E]" },
              { label: "Background", bg: "bg-background border border-border" },
              { label: "Card", bg: "bg-card border border-border" },
              { label: "Muted", bg: "bg-muted" },
              { label: "Border", bg: "bg-border" },
            ].map(c => (
              <div key={c.label} className="space-y-1">
                <div className={cn("h-10 rounded-lg", c.bg)} />
                <p className="text-xs text-muted-foreground text-center">{c.label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Типографика">
          <div className="space-y-2">
            <p className="text-3xl font-black" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Plus Jakarta Sans Black — Заголовок H1</p>
            <p className="text-xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Plus Jakarta Sans Bold — Заголовок H2</p>
            <p className="text-base font-semibold">Plus Jakarta Sans SemiBold — Подзаголовок</p>
            <p className="text-sm">Plus Jakarta Sans Regular — Основной текст для чтения</p>
            <p className="text-xs text-muted-foreground">Plus Jakarta Sans — Мелкий текст, метаданные</p>
            <p className="font-mono text-lg text-primary">280 000 ₸ — JetBrains Mono (цены)</p>
            <p className="font-mono text-sm text-muted-foreground">****1234 — Student ID</p>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-black text-foreground border-b border-border pb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
