import { useState, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Camera,
  CreditCard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001");

interface ExtractedData {
  name: string | null;
  studentId: string | null;
  expiryDate: string | null;
}

interface VerifyResult {
  isValid: boolean;
  extractedData: ExtractedData;
  reason: string | null;
}

type Status = "idle" | "preview" | "analyzing" | "success" | "error";

export default function VerifyIdPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 10 МБ)");
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setStatus("preview");
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    if (!file) return;
    setStatus("analyzing");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Attach the Supabase bearer token so the backend knows who is
      // verifying and can persist isStudentVerified on the User row.
      let {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      let res = await fetch(`${API_URL}/api/auth/verify-id-card`, {
        method: "POST",
        body: formData,
        headers,
      });

      // Retry once on 401 — token may have expired while picking the photo.
      if (res.status === 401 && session?.access_token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session) {
          headers.Authorization = `Bearer ${refreshed.session.access_token}`;
          res = await fetch(`${API_URL}/api/auth/verify-id-card`, {
            method: "POST",
            body: formData,
            headers,
          });
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          (err as { error?: string } | null)?.error ?? `HTTP ${res.status}`,
        );
      }

      const data = (await res.json()) as VerifyResult;
      setResult(data);
      setStatus(data.isValid ? "success" : "error");

      if (data.isValid) {
        toast.success("Карта верифицирована!");
        // Refresh the profile cache so ProfilePage hides the banner.
        void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      } else {
        toast.error(data.reason ?? "Верификация не пройдена");
      }
    } catch (err) {
      setStatus("error");
      setResult({
        isValid: false,
        extractedData: { name: null, studentId: null, expiryDate: null },
        reason: err instanceof Error ? err.message : "Ошибка сети",
      });
      toast.error("Ошибка при верификации");
    }
  };

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <Link
          href="/register"
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="text-base font-bold text-foreground">comunikit</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Верификация студента
              </h1>
              <p className="text-sm text-muted-foreground">
                Загрузите фото студенческого удостоверения AITU
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            {/* Drop zone / preview */}
            {status === "idle" && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 p-10 cursor-pointer transition-colors"
              >
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="size-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Перетащите фото или нажмите для выбора
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG или WebP, до 10 МБ
                  </p>
                </div>
                <Button variant="outline" size="sm" type="button">
                  <Camera className="size-4 mr-2" />
                  Выбрать файл
                </Button>
              </div>
            )}

            {(status === "preview" ||
              status === "analyzing" ||
              status === "success" ||
              status === "error") &&
              preview && (
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
                    <img
                      src={preview}
                      alt="Student ID preview"
                      className="w-full max-h-64 object-contain"
                    />
                    {status === "analyzing" && (
                      <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="size-8 text-primary animate-spin" />
                        <p className="text-sm font-medium text-foreground">
                          ИИ анализирует карту...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Result */}
                  {result && status === "success" && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="size-5 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-500">
                          Карта верифицирована
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {result.extractedData.name && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Имя</span>
                            <span className="font-medium text-foreground">
                              {result.extractedData.name}
                            </span>
                          </div>
                        )}
                        {result.extractedData.studentId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Student ID
                            </span>
                            <span className="font-medium text-foreground">
                              {result.extractedData.studentId}
                            </span>
                          </div>
                        )}
                        {result.extractedData.expiryDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Действительна до
                            </span>
                            <span className="font-medium text-foreground">
                              {result.extractedData.expiryDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {result && status === "error" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="size-5 text-destructive" />
                        <span className="text-sm font-semibold text-destructive">
                          Верификация не пройдена
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.reason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={reset}
                      disabled={status === "analyzing"}
                    >
                      Загрузить другое фото
                    </Button>
                    {(status === "preview" || status === "error") && (
                      <Button className="flex-1" onClick={handleSubmit}>
                        <Upload className="size-4 mr-2" />
                        Верифицировать
                      </Button>
                    )}
                    {status === "success" && (
                      <Button
                        className="flex-1"
                        onClick={() => navigate("/forum")}
                      >
                        Продолжить
                      </Button>
                    )}
                  </div>
                </div>
              )}

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Hint */}
          <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Мы используем ИИ для проверки вашего студенческого удостоверения
              AITU. Фото не сохраняется на серверах и используется только для
              одноразовой верификации. Убедитесь, что на фото видны: имя, дата
              действия и логотип AITU.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
