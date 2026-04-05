/* comunikit — AdminDashboard
   Design: RunPod settings/dashboard hybrid — stats row, tabs, moderation table
*/
import { useState } from "react";
import {
  Shield, Search, Plus, Download, CheckCircle2, XCircle, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminTab = "moderation" | "whitelist" | "system";

const STATS = [
  { label: "Пользователей", value: "1,248" },
  { label: "Объявлений", value: "534" },
  { label: "Жалоб", value: "3" },
  { label: "Активных", value: "87" },
];

const WHITELIST_DATA = [
  { id: "12345", name: "Алиев Арман", group: "CS-21-K", status: "active", email: "arman@aituc.edu.kz" },
  { id: "23456", name: "Сейткали Диана", group: "IT-22-A", status: "active", email: "diana@aituc.edu.kz" },
  { id: "34567", name: "Жаксыбеков Ерлан", group: "SE-20-K", status: "active", email: "erlan@aituc.edu.kz" },
  { id: "45678", name: "Ким Александр", group: "CS-21-K", status: "pending", email: "alex@aituc.edu.kz" },
  { id: "56789", name: "Петров Иван", group: "IT-21-B", status: "active", email: "ivan@aituc.edu.kz" },
  { id: "67890", name: "Асанова Мадина", group: "CS-23-A", status: "blocked", email: "madina@aituc.edu.kz" },
];

const MODERATION_QUEUE = [
  { id: "rep1", type: "listing", title: "Подозрительное объявление: iPhone за 5000₸", reporter: "Ким А.", time: "2h ago", severity: "high" },
  { id: "rep2", type: "user", title: "Пользователь не отвечает после сделки", reporter: "Петров И.", time: "5h ago", severity: "medium" },
  { id: "rep3", type: "comment", title: "Оскорбительный комментарий в объявлении", reporter: "Асанова М.", time: "1d ago", severity: "low" },
];

const ACTIVITY = [
  { text: "Новый пользователь: Омаров Б. (IT-22-K)", time: "5m ago", type: "user" },
  { text: "Объявление опубликовано: MacBook Air M1", time: "12m ago", type: "listing" },
  { text: "Жалоба на объявление #rep1", time: "2h ago", type: "report" },
  { text: "Пользователь заблокирован: Асанова М.", time: "3h ago", type: "block" },
];

const TABS = [
  { value: "moderation", label: "Модерация" },
  { value: "whitelist", label: "Whitelist" },
  { value: "system", label: "Система" },
] as const;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("moderation");
  const [searchWhitelist, setSearchWhitelist] = useState("");

  const filteredWhitelist = WHITELIST_DATA.filter(u =>
    u.name.toLowerCase().includes(searchWhitelist.toLowerCase()) ||
    u.id.includes(searchWhitelist) ||
    u.group.toLowerCase().includes(searchWhitelist.toLowerCase())
  );

  return (
    <AppLayout title="Панель администратора">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Breadcrumb / admin badge */}
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="font-mono">admin</span>
          <span>/</span>
          <span className="font-mono text-foreground">{activeTab}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {STATS.map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="text-2xl font-bold font-mono text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {TABS.map(tab => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold transition-colors relative -mb-px border-b-2",
                  active
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.value === "moderation" && MODERATION_QUEUE.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold px-1">
                    {MODERATION_QUEUE.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Moderation */}
        {activeTab === "moderation" && (
          <div className="bg-card border border-border rounded-xl p-4 ck-animate-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Очередь модерации</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Жалобы на пользователей и контент</p>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{MODERATION_QUEUE.length} pending</span>
            </div>

            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-semibold">ID</th>
                    <th className="px-4 py-2 font-semibold">Тип</th>
                    <th className="px-4 py-2 font-semibold">Описание</th>
                    <th className="px-4 py-2 font-semibold hidden md:table-cell">Репортер</th>
                    <th className="px-4 py-2 font-semibold hidden md:table-cell">Приоритет</th>
                    <th className="px-4 py-2 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {MODERATION_QUEUE.map(r => (
                    <tr
                      key={r.id}
                      className="bg-card border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{r.title}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.reporter} · {r.time}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase",
                          r.severity === "high" ? "bg-red-500/15 text-red-400" :
                          r.severity === "medium" ? "bg-amber-500/15 text-amber-400" :
                          "bg-blue-500/15 text-blue-400"
                        )}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toast.success("Одобрено")}
                            className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => toast.success("Отклонено")}
                            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Whitelist */}
        {activeTab === "whitelist" && (
          <div className="bg-card border border-border rounded-xl p-4 ck-animate-in">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">Whitelist студентов</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Верифицированные пользователи AITUC</p>
              </div>
              <Button
                onClick={() => toast.info("Добавление студента в разработке")}
                size="sm"
                className="gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по ID, имени, группе..."
                value={searchWhitelist}
                onChange={e => setSearchWhitelist(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-semibold">Student ID</th>
                    <th className="px-4 py-2 font-semibold">Имя</th>
                    <th className="px-4 py-2 font-semibold hidden sm:table-cell">Группа</th>
                    <th className="px-4 py-2 font-semibold">Статус</th>
                    <th className="px-4 py-2 font-semibold text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWhitelist.map(user => (
                    <tr
                      key={user.id}
                      className="bg-card border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.id}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">{user.group}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase",
                          user.status === "active" ? "bg-green-500/15 text-green-400" :
                          user.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                          "bg-red-500/15 text-red-400"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toast.success(`${user.name} — активирован`)}
                            className="flex items-center gap-1 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                            title="Активировать"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => toast.success(`${user.name} — заблокирован`)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                            title="Заблокировать"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System */}
        {activeTab === "system" && (
          <div className="bg-card border border-border rounded-xl p-4 ck-animate-in space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground">Последние действия</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Системный лог</p>
            </div>

            <div className="space-y-2">
              {ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    item.type === "user" ? "bg-blue-400" :
                    item.type === "listing" ? "bg-primary" :
                    item.type === "report" ? "bg-red-400" : "bg-muted-foreground"
                  )} />
                  <span className="flex-1 text-foreground/80">{item.text}</span>
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Инфраструктура</h4>
              <Button
                variant="outline"
                className="w-full gap-2 h-11 justify-start"
                onClick={() => toast.success("Бэкап создаётся... Готово!")}
              >
                <Download className="w-4 h-4" /> Создать бэкап базы данных
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
