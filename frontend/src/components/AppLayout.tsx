/* comunikit — AppLayout v3
   RunPod-style navigation:
   - Desktop (lg+): icon-only sidebar 64px + top header
   - Mobile (<lg):  top header + bottom nav bar
*/
import { useRef, useEffect, useState, useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  MapPin,
  Plus,
  MessageSquare,
  User,
  Shield,
  Boxes,
  Settings,
  Search,
  ShoppingBag,
  SearchCheck,
  Bookmark,
  Heart,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ── Navigation definitions ──────────────────────────────────── */

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const SIDEBAR_TOP_ITEMS: NavItem[] = [
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/marketplace", icon: ShoppingBag, label: "Маркетплейс" },
  { href: "/lost-and-found", icon: SearchCheck, label: "Бюро находок" },
  { href: "/map", icon: MapPin, label: "Карта" },
  { href: "/saved", icon: Bookmark, label: "Сохранённое" },
  { href: "/liked", icon: Heart, label: "Понравилось" },
  { href: "/create", icon: Plus, label: "Создать" },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/forum", icon: MessageSquare, label: "Форум" },
  { href: "/marketplace", icon: ShoppingBag, label: "Маркетплейс" },
  { href: "/create", icon: Plus, label: "Создать" },
  { href: "/lost-and-found", icon: SearchCheck, label: "Находки" },
  { href: "/profile", icon: User, label: "Профиль" },
];

/* ── Props ───────────────────────────────────────────────────── */

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

/* ── Sidebar icon button (desktop only) ──────────────────────── */

function SidebarIconBtn({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;
  const isCreate = item.href === "/create";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href}>
          {/* Full-width row so the left-edge indicator reaches the sidebar border */}
          <div className="relative w-full flex items-center justify-center h-11">
            {active && (
              <div className="absolute left-0 inset-y-2 w-0.5 bg-primary rounded-r-full" />
            )}
            <div
              className={cn(
                "ck-sidebar-icon",
                active && "active",
                isCreate && !active && "text-primary bg-primary/5 hover:bg-primary/15",
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export default function AppLayout({ title, children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  // TODO: replace with auth store value
  const isAdmin = false;

  function isActive(href: string) {
    return location === href || location.startsWith(href + "/");
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* ═══════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (≥ lg / 1024px)
          Icon-only, w-16 = 64px, fixed full-height.
          ═══════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-16 shrink-0 bg-sidebar border-r border-sidebar-border h-full">
        {/* Logo — Boxes icon */}
        <div className="flex items-center justify-center h-14 border-b border-sidebar-border shrink-0">
          <Link href="/forum">
            <Boxes className="w-6 h-6 text-primary shrink-0" />
          </Link>
        </div>

        {/* Top nav items */}
        <nav className="flex flex-col items-center py-2 flex-1 overflow-y-auto">
          {SIDEBAR_TOP_ITEMS.map((item) => (
            <SidebarIconBtn key={item.href} item={item} active={isActive(item.href)} />
          ))}
          {isAdmin && (
            <SidebarIconBtn
              item={{ href: "/admin", icon: Shield, label: "Админ" }}
              active={isActive("/admin")}
            />
          )}
        </nav>

        {/* Bottom: Settings + Profile */}
        <div className="flex flex-col items-center py-3 border-t border-sidebar-border gap-1">
          <SidebarIconBtn
            item={{ href: "/settings", icon: Settings, label: "Настройки" }}
            active={isActive("/settings")}
          />
          <SidebarIconBtn
            item={{ href: "/profile", icon: User, label: "Профиль" }}
            active={isActive("/profile")}
          />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="shrink-0 z-40 h-14 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 h-full">
            {/* Mobile: logo + title */}
            <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
              <Link href="/forum">
                <Boxes className="w-6 h-6 text-primary shrink-0" />
              </Link>
              <span className="text-sm font-semibold text-foreground truncate">
                {title}
              </span>
            </div>

            {/* Desktop: page title */}
            <h1 className="hidden lg:block text-lg font-bold text-foreground flex-1 truncate">
              {title}
            </h1>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search hint — desktop only */}
              <button
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground bg-muted/60 border border-border/60 hover:bg-accent hover:text-foreground transition-colors"
                onClick={() => navigate("/search")}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Поиск</span>
                <kbd className="ml-1 text-[10px] opacity-60">⌘K</kbd>
              </button>

              {/* Notification bell */}
              <NotificationBell />

              {/* Avatar */}
              <Link href="/profile">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                    А
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────── */}
        <main className="flex-1 pb-20 lg:pb-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION  (< lg / 1024px)
          Glassmorphism bar, FAB for create action.
          ═══════════════════════════════════════════════════════ */}
      <MobileBottomNav location={location} isActive={isActive} />
    </div>
  );
}

/* ── Mobile bottom nav with sliding indicator ─────────────── */

function MobileBottomNav({
  location,
  isActive,
}: {
  location: string;
  isActive: (href: string) => boolean;
}) {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const setItemRef = useCallback((href: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(href, el);
    else itemRefs.current.delete(href);
  }, []);

  useEffect(() => {
    const activeHref = MOBILE_NAV_ITEMS.find(
      (item) => item.href !== "/create" && isActive(item.href),
    )?.href;
    if (!activeHref || !navRef.current) {
      setIndicator(null);
      return;
    }
    const el = itemRefs.current.get(activeHref);
    if (!el) return;
    const navRect = navRef.current.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    setIndicator({
      left: itemRect.left - navRect.left,
      width: itemRect.width,
    });
  }, [location, isActive]);

  return (
    <nav
      ref={navRef}
      className="ck-bottom-nav ck-glass fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Основная навигация"
    >
      {/* Sliding pill indicator */}
      {indicator && (
        <div
          className="absolute top-1.5 h-[calc(100%-12px)] rounded-2xl bg-primary/10 transition-all duration-300 ease-out pointer-events-none"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}

      {MOBILE_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        const isCreate = href === "/create";
        return (
          <Link key={href} href={href}>
            <div
              ref={(el) => setItemRef(href, el)}
              className={cn("ck-bottom-nav-item relative z-10", active && "active")}
            >
              {isCreate ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground ck-primary-glow -mt-1">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{label}</span>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
