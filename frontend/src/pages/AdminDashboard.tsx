/* comunikit — AdminDashboard
   Design: "Digital Bazaar" — stats cards, whitelist table, reports queue
*/
import { useState } from "react";
import {
  Users, FileText, Flag, Download, CheckCircle2, XCircle,
  Search, Plus, Shield, BarChart2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AdminTab = "overview" | "whitelist" | "reports";

const WHITELIST_DATA = [
  { id: "12345", name: "Алиев Арман", group: "CS-21-K", status: "active", email: "arman@aituc.edu.kz" },
  { id: "23456", name: "Сейткали Диана", group: "IT-22-A", status: "active", email: "diana@aituc.edu.kz" },
  { id: "34567", name: "Жаксыбеков Ерлан", group: "SE-20-K", status: "active", email: "erlan@aituc.edu.kz" },
  { id: "45678", name: "Ким Александр", group: "CS-21-K", status: "pending", email: "alex@aituc.edu.kz" },
  { id: "56789", name: "Петров Иван", group: "IT-21-B", status: "active", email: "ivan@aituc.edu.kz" },
  { id: "67890", name: "Асанова Мадина", group: "CS-23-A", status: "blocked", email: "madina@aituc.edu.kz" },
];

const REPORTS_DATA = [
  { id: "rep1", type: "listing", title: "Подозрительное объявление: iPhone за 5000₸", reporter: "Ким А.", time: "2h ago", severity: "high" },
  { id: "rep2", type: "user", title: "Пользователь не отвечает после сделки", reporter: "Петров И.", time: "5h ago", severity: "medium" },
  { id: "rep3", type: "comment", title: "Оскорбительный комментарий в объявлении", reporter: "Асанова М.", time: "1d ago", severity: "low" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchWhitelist, setSearchWhitelist] = useState("");

  const filteredWhitelist = WHITELIST_DATA.filter(u =>
    u.name.toLowerCase().includes(searchWhitelist.toLowerCase()) ||
    u.id.includes(searchWhitelist) ||
    u.group.toLowerCase().includes(searchWhitelist.toLowerCase())
  );

  return (
    <AppLayout title="Панель администратора">
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Admin badge */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary">Панель администратора AITUC</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { value: "overview", label: "Обзор", icon: BarChart2 },
            { value: "whitelist", label: "Whitelist", icon: Users },
            { value: "reports", label: "Жалобы", icon: Flag },
          ] as const).map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                activeTab === tab.value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.value === "reports" && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {REPORTS_DATA.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-5 ck-animate-in">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Пользователей", value: "1,248", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "Объявлений", value: "534", icon: FileText, color: "text-primary", bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20" },
                { label: "Жалоб", value: "3", icon: Flag, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
                { label: "Активных сегодня", value: "87", icon: BarChart2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl bg-card border border-border">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div className="text-2xl font-black text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <h3 className="font-bold text-foreground">Последние действия</h3>
              {[
                { text: "Новый пользователь: Омаров Б. (IT-22-K)", time: "5m ago", type: "user" },
                { text: "Объявление опубликовано: MacBook Air M1", time: "12m ago", type: "listing" },
                { text: "Жалоба на объявление #rep1", time: "2h ago", type: "report" },
                { text: "Пользователь заблокирован: Асанова М.", time: "3h ago", type: "block" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    item.type === "user" ? "bg-blue-500" :
                    item.type === "listing" ? "bg-primary" :
                    item.type === "report" ? "bg-red-500" : "bg-gray-500"
                  )} />
                  <span className="flex-1 text-foreground/80">{item.text}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>

            {/* Backup */}
            <Button
              variant="outline"
              className="w-full gap-2 h-11"
              onClick={() => toast.success("Бэкап создаётся... Готово!")}
            >
              <Download className="w-4 h-4" /> Создать бэкап базы данных
            </Button>
          </div>
        )}

        {/* Whitelist */}
        {activeTab === "whitelist" && (
          <div className="space-y-4 ck-animate-in">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ID, имени, группе..."
                  value={searchWhitelist}
                  onChange={e => setSearchWhitelist(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={() => toast.info("Добавление студента в разработке")}
                style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Добавить
              </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Student ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Имя</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Группа</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Статус</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWhitelist.map((user, i) => (
                      <tr key={user.id} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/20")}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.id}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{user.group}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-semibold",
                            user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                            user.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {user.status === "active" ? "Активен" : user.status === "pending" ? "Ожидает" : "Заблокирован"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toast.success(`${user.name} — статус изменён`)}
                              className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                              title="Активировать"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toast.success(`${user.name} — заблокирован`)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                              title="Заблокировать"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="space-y-3 ck-animate-in">
            {REPORTS_DATA.map(report => (
              <div key={report.id} className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    report.severity === "high" ? "bg-red-100 dark:bg-red-900/20" :
                    report.severity === "medium" ? "bg-amber-100 dark:bg-amber-900/20" :
                    "bg-blue-100 dark:bg-blue-900/20"
                  )}>
                    <AlertTriangle className={cn(
                      "w-5 h-5",
                      report.severity === "high" ? "text-red-500" :
                      report.severity === "medium" ? "text-amber-500" : "text-blue-500"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">от {report.reporter}</span>
                      <span className="text-xs text-muted-foreground">· {report.time}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                        report.severity === "high" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                        report.severity === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      )}>
                        {report.severity === "high" ? "Высокий" : report.severity === "medium" ? "Средний" : "Низкий"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30"
                    onClick={() => toast.success("Контент удалён")}>
                    Удалить
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1"
                    onClick={() => toast.success("Жалоба отклонена")}>
                    Отклонить
                  </Button>
                  <Button size="sm" className="flex-1"
                    style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                    onClick={() => toast.info("Открываем объявление...")}>
                    Просмотреть
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
