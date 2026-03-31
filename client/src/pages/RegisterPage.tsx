/* comunikit — RegisterPage (Whitelist Flow)
   Design: "Digital Bazaar" — step-by-step registration with ID validation
*/
import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";

const AUTH_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-auth-bg-moYk5zn6xKQFj8gUgJ3HTC.webp";

// Mock whitelist
const WHITELIST: Record<string, { name: string; group: string }> = {
  "12345": { name: "Алиев Арман", group: "CS-21-K" },
  "23456": { name: "Сейткали Диана", group: "IT-22-A" },
  "34567": { name: "Жаксыбеков Ерлан", group: "SE-20-K" },
  "99999": { name: "Тест Студент", group: "IT-23-B" },
};

type Step = 1 | 2;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [studentId, setStudentId] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [idStatus, setIdStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [autoName, setAutoName] = useState("");
  const [autoGroup, setAutoGroup] = useState("");

  // Step 2
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkStudentId = async () => {
    if (studentId.length < 5) {
      setErrors({ studentId: "ID должен содержать 5–8 цифр" });
      return;
    }
    setIdStatus("checking");
    await new Promise(r => setTimeout(r, 800));
    const found = WHITELIST[studentId];
    if (found) {
      setIdStatus("valid");
      setAutoName(found.name);
      setAutoGroup(found.group);
      setGroupCode(found.group);
      setErrors({});
      toast.success("Студент найден в базе AITUC!");
    } else {
      setIdStatus("invalid");
      setAutoName("");
      setAutoGroup("");
      setErrors({ studentId: "ID не найден в базе студентов AITUC" });
    }
  };

  const handleStep1 = () => {
    if (idStatus !== "valid") {
      setErrors({ studentId: "Сначала проверьте Student ID" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!email) e.email = "Введите email";
    else if (!email.includes("@")) e.email = "Некорректный email";
    if (!password) e.password = "Введите пароль";
    else if (password.length < 8) e.password = "Минимум 8 символов";
    if (password !== confirmPassword) e.confirmPassword = "Пароли не совпадают";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    toast.success("Аккаунт создан! Добро пожаловать в comunikit 🎉");
    navigate("/feed");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden p-10"
        style={{ background: `url(${AUTH_BG}) center/cover no-repeat` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/70 to-orange-600/50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl bg-white/20 backdrop-blur-sm">c</div>
            <span className="font-black text-2xl text-white" style={{ fontFamily: "Nunito, sans-serif" }}>comunikit</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Nunito, sans-serif" }}>
            Присоединяйся<br />к сообществу
          </h2>
          <div className="space-y-3">
            {["Закрытая платформа только для студентов AITUC", "Верификация по Student ID", "Безопасные сделки внутри кампуса"].map(t => (
              <div key={t} className="flex items-center gap-2 text-white/80">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/50 text-sm">© 2024 comunikit · Astana IT University College</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>c</div>
          <span className="font-black text-2xl text-foreground" style={{ fontFamily: "Nunito, sans-serif" }}>
            comuni<span className="text-primary">kit</span>
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>{s}</div>
                {s < 2 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {step === 1 ? "Верификация" : "Данные аккаунта"}
            </span>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-black text-foreground mb-2" style={{ fontFamily: "Nunito, sans-serif" }}>Регистрация</h1>
                <p className="text-muted-foreground text-sm">Введите ваш Student ID для верификации</p>
              </div>
              <div className="space-y-5">
                {/* Student ID */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Student ID</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="12345"
                        value={studentId}
                        onChange={e => {
                          setStudentId(e.target.value.replace(/\D/g, "").slice(0, 8));
                          setIdStatus("idle");
                          setAutoName("");
                          setAutoGroup("");
                        }}
                        maxLength={8}
                        className={`font-mono pr-8 ${errors.studentId ? "border-destructive" : idStatus === "valid" ? "border-green-500" : ""}`}
                      />
                      {idStatus === "valid" && <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                      {idStatus === "invalid" && <XCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkStudentId}
                      disabled={idStatus === "checking" || studentId.length < 5}
                      className="shrink-0"
                    >
                      {idStatus === "checking" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Проверить"}
                    </Button>
                  </div>
                  {errors.studentId && <p className="text-xs text-destructive">{errors.studentId}</p>}
                  <p className="text-xs text-muted-foreground">5–8 цифр (попробуй: 12345, 23456, 99999)</p>
                </div>

                {/* Auto-filled name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Полное имя</Label>
                  <Input
                    value={autoName}
                    readOnly
                    placeholder="Автозаполнится после проверки ID"
                    className="bg-muted/50 text-muted-foreground"
                  />
                </div>

                {/* Group code */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Код группы</Label>
                  <Input
                    value={autoGroup || groupCode}
                    onChange={e => setGroupCode(e.target.value)}
                    placeholder="CS-21-K"
                    className={autoGroup ? "bg-muted/50 text-muted-foreground" : ""}
                    readOnly={!!autoGroup}
                  />
                </div>

                <Button
                  onClick={handleStep1}
                  className="w-full h-11 font-bold"
                  style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                  disabled={idStatus !== "valid"}
                >
                  Продолжить →
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Назад
                </button>
                <h1 className="text-3xl font-black text-foreground mb-1" style={{ fontFamily: "Nunito, sans-serif" }}>Создать аккаунт</h1>
                <p className="text-muted-foreground text-sm">Привет, <strong>{autoName}</strong>! Заполните данные входа.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Email</Label>
                  <Input
                    type="email"
                    placeholder="student@aituc.edu.kz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Пароль</Label>
                  <div className="relative">
                    <Input
                      type={showPass ? "text" : "password"}
                      placeholder="Минимум 8 символов"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Подтвердить пароль</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Повторите пароль"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 font-bold text-base mt-2"
                  disabled={loading}
                  style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Создаём аккаунт...</> : "Зарегистрироваться"}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/login"><span className="text-primary font-semibold hover:underline">Войти</span></Link>
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-muted/60 border border-border">
            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">Только для студентов Astana IT University College (AITUC)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
