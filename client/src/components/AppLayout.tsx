/* comunikit — AppLayout
   Design: "Digital Bazaar" — amber-orange primary, warm white/dark navy bg
   Bottom nav on mobile, left sidebar on desktop, sticky header
*/
import { useLocation } from "wouter";
import { Link } from "wouter";
import {
  Home, Search, PlusCircle, Map, MessageSquare,
  User, ShieldCheck, LayoutGrid, Moon, Sun, Menu, X, Bell
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/create", icon: PlusCircle, label: "Добавить" },
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/profile", icon: User, label: "Профиль" },
];

const SIDEBAR_ITEMS = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/profile", icon: User, label: "Профиль" },
  { href: "/admin", icon: ShieldCheck, label: "Админ" },
  { href: "/components", icon: LayoutGrid, label: "Компоненты" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  hideFab?: boolean;
}

export default function AppLayout({ children, title, showBack, onBack, headerRight, hideFab }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            c
          </div>
          <div>
            <span className="font-black text-xl text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
              comuni<span className="text-primary">kit</span>
            </span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">AITUC Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SIDEBAR_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                location === href || location.startsWith(href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}>
                <Icon className="w-5 h-5 shrink-0" strokeWidth={location === href || location.startsWith(href + "/") ? 2.5 : 1.75} />
                {label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </button>
          <Link href="/create">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 mt-2"
              style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
              <PlusCircle className="w-5 h-5" />
              Добавить объявление
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-sidebar border-r border-border flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="font-black text-xl text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
                comuni<span className="text-primary">kit</span>
              </span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {SIDEBAR_ITEMS.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
                      location === href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </div>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            {/* Mobile: hamburger */}
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo (mobile only) */}
            <div className="lg:hidden flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm"
                style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                c
              </div>
              <span className="font-black text-lg text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
                comuni<span className="text-primary">kit</span>
              </span>
            </div>

            {/* Desktop: page title */}
            {title && (
              <h1 className="hidden lg:block text-lg font-bold text-foreground flex-1">{title}</h1>
            )}
            {!title && <div className="hidden lg:block flex-1" />}

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {headerRight}
              <button
                onClick={() => toast.info("Уведомлений нет")}
                className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  А
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="ck-bottom-nav lg:hidden">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = location === href || location.startsWith(href + "/");
          const isCreate = href === "/create";
          return (
            <Link key={href} href={href}>
              <div className={cn("ck-bottom-nav-item", isActive ? "active" : "")}>
                {isCreate ? (
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center -mt-3 shadow-lg"
                    style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center gap-0.5">
                    {isActive && (
                      <span className="absolute -top-3 w-4 h-0.5 rounded-full bg-primary" />
                    )}
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </div>
                )}
                {isCreate && <span className="text-[10px] font-semibold mt-0.5">{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
