/* comunikit — AppLayout v2
   Phase 2 Redesign: Mobile-first with sticky bottom nav + desktop sidebar.
   Uses Shadcn Sheet for mobile sidebar, Radix Avatar, clean Lucide icons.
   Design tokens from DESIGN.md — all spacing/colors via Tailwind v4 utilities.
*/
import { useLocation, Link } from "wouter";
import {
  Home, Map, PlusCircle, MessageSquare, User,
  ShieldCheck, LayoutGrid, Moon, Sun, Bell, Menu,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

/* ── Navigation definitions ─────────────────────────────────── */

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/create", icon: PlusCircle, label: "Добавить" },
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/profile", icon: User, label: "Профиль" },
];

const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { href: "/feed", icon: Home, label: "Лента" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/profile", icon: User, label: "Профиль" },
  { href: "/admin", icon: ShieldCheck, label: "Админ" },
  { href: "/components", icon: LayoutGrid, label: "Компоненты" },
];

/* ── Props ───────────────────────────────────────────────────── */

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  hideFab?: boolean;
}

/* ── Shared sub-components ───────────────────────────────────── */

function BrandLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm"
    ? "w-7 h-7 text-sm rounded-lg"
    : "w-9 h-9 text-lg rounded-xl";

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          dims,
          "flex items-center justify-center font-black text-white",
        )}
        style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
      >
        c
      </div>
      <div>
        <span
          className={cn(
            "font-black text-foreground",
            size === "sm" ? "text-lg" : "text-xl",
          )}
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          comuni<span className="text-primary">kit</span>
        </span>
        {size === "md" && (
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
            AITUC Platform
          </p>
        )}
      </div>
    </div>
  );
}

function SidebarNavLink({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        onClick={onClick}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {item.label}
      </div>
    </Link>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function AppLayout({
  children,
  title,
  headerRight,
}: AppLayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  function isActive(href: string) {
    return location === href || location.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (≥ md / 768px)
          Fixed left sidebar w-64, full height.
          ═══════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center px-6 py-5 border-b border-border">
          <BrandLogo size="md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-150"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </button>
          <Link href="/create">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 mt-2"
              style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
            >
              <PlusCircle className="w-5 h-5" />
              Добавить объявление
            </div>
          </Link>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MOBILE SIDEBAR SHEET  (< md / 768px)
          Radix Sheet sliding from the left.
          ═══════════════════════════════════════════════════════ */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle asChild>
              <div>
                <BrandLogo size="sm" />
              </div>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {SIDEBAR_NAV_ITEMS.map((item) => (
              <SidebarNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={() => setMobileSheetOpen(false)}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Sticky Header ──────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            {/* Mobile: hamburger menu trigger */}
            <button
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileSheetOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile: logo */}
            <div className="md:hidden flex items-center gap-2 flex-1">
              <BrandLogo size="sm" />
            </div>

            {/* Desktop: page title */}
            {title ? (
              <h1 className="hidden md:block text-lg font-bold text-foreground flex-1">
                {title}
              </h1>
            ) : (
              <div className="hidden md:block flex-1" />
            )}

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {headerRight}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl"
                onClick={() => toast.info("Уведомлений нет")}
                aria-label="Уведомления"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={toggleTheme}
                aria-label="Переключить тему"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <Link href="/profile">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                    А
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────── */}
        <main className="flex-1 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION  (< md / 768px)
          Sticky 5-icon bottom bar with safe-area padding.
          ═══════════════════════════════════════════════════════ */}
      <nav className="ck-bottom-nav md:hidden" aria-label="Основная навигация">
        {BOTTOM_NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <div
              className={cn(
                "ck-bottom-nav-item",
                isActive(href) ? "active" : "",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  href === "/create" ? "text-primary" : "",
                )}
              />
              <span className="text-[10px] font-semibold">{label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
