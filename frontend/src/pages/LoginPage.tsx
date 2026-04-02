/* comunikit — LoginPage
   Design: "Digital Bazaar" — warm amber auth background, dark text on light card
   Split layout: left=hero image, right=form (desktop); stacked (mobile)
*/
import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";

const AUTH_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-auth-bg-moYk5zn6xKQFj8gUgJ3HTC.webp";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Введите email";
    else if (!email.includes("@")) e.email = "Некорректный email";
    if (!password) e.password = "Введите пароль";
    else if (password.length < 6) e.password = "Минимум 6 символов";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    toast.success("Добро пожаловать в comunikit!");
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-10"
        style={{
          background: `url(${AUTH_BG}) center/cover no-repeat`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/70 to-fuchsia-700/50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl bg-white/20 backdrop-blur-sm">
              c
            </div>
            <span className="font-black text-2xl text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              comunikit
            </span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Твой цифровой<br />студенческий базар
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Продавай, покупай, находи потерянное — всё в одном месте только для студентов AITUC.
          </p>
          <div className="flex gap-6 mt-8">
            {[["500+", "Объявлений"], ["1200+", "Студентов"], ["98%", "Довольных"]].map(([num, label]) => (
              <div key={label}>
                <div className="text-2xl font-black text-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{num}</div>
                <div className="text-white/70 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-sm">
          © 2024 comunikit · Astana IT University College
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            c
          </div>
          <span className="font-black text-2xl text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            comuni<span className="text-primary">kit</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Войти
            </h1>
            <p className="text-muted-foreground">Введите данные вашего аккаунта</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@aituc.edu.kz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Пароль</Label>
                <button
                  type="button"
                  onClick={() => toast.info("Функция восстановления пароля в разработке")}
                  className="text-xs text-primary hover:underline"
                >
                  Забыл пароль?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold text-base"
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Входим...</> : "Войти"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link href="/register">
                <span className="text-primary font-semibold hover:underline">Зарегистрироваться</span>
              </Link>
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2 p-3 rounded-xl bg-muted/60 border border-border">
            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Только для студентов Astana IT University College (AITUC)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
