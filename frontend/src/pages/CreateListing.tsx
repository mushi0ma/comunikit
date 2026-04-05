/* comunikit — CreateListing (RunPod-inspired single-page form)
   Design: clean card sections, option cards, dashed upload zone
*/
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Upload, X, MapPin, Loader2, Send,
  ShoppingBag, Search, Banknote, ShoppingCart, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { CATEGORIES, formatPrice } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MainType = "marketplace" | "lostfound";
type SubType = "sell" | "buy" | "service" | "lost" | "found";

const MAIN_TYPES = [
  { value: "marketplace" as const, label: "Маркетплейс", Icon: ShoppingBag, desc: "Продать, купить, услуга" },
  { value: "lostfound" as const,   label: "Lost & Found", Icon: Search,      desc: "Потерял или нашёл вещь" },
];

const SUB_TYPES: Record<MainType, { value: SubType; label: string; Icon: React.ElementType }[]> = {
  marketplace: [
    { value: "sell",    label: "Продам",  Icon: Banknote },
    { value: "buy",     label: "Куплю",   Icon: ShoppingCart },
    { value: "service", label: "Услуга",  Icon: Wrench },
  ],
  lostfound: [
    { value: "lost",  label: "Потерял", Icon: Search },
    { value: "found", label: "Нашёл",   Icon: Search },
  ],
};

export default function CreateListing() {
  const [, navigate] = useLocation();
  const [mainType, setMainType] = useState<MainType | null>(null);
  const [subType, setSubType] = useState<SubType | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [locationText, setLocationText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLostFound = mainType === "lostfound";
  const showPrice = subType === "sell" || subType === "service";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error("Максимум 5 фотографий");
      return;
    }
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (images.length + files.length > 5) {
      toast.error("Максимум 5 фотографий");
      return;
    }
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const canPublish =
    !!mainType && !!subType && title.length >= 5 && !!category && description.length >= 10;

  const handlePublish = async () => {
    if (!canPublish) {
      toast.error("Заполните обязательные поля");
      return;
    }
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1500));
    setPublishing(false);
    toast.success("Объявление опубликовано!");
    navigate("/feed");
  };

  return (
    <AppLayout title="Новое объявление">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate("/feed")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к ленте
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-black text-foreground mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Новое объявление
          </h1>
          <p className="text-sm text-muted-foreground">
            Заполните форму — одна страница, без лишних шагов
          </p>
        </div>

        <div className="flex flex-col gap-6 ck-animate-in">
          {/* ── Section: Type ───────────────────────────── */}
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Тип объявления</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Выберите категорию</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MAIN_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => { setMainType(type.value); setSubType(null); }}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    mainType === type.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  )}
                >
                  <type.Icon className="size-5 mb-2" />
                  <div className="text-sm font-semibold">{type.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>

            {mainType && (
              <div className="flex flex-col gap-2 ck-animate-in">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Уточните
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SUB_TYPES[mainType].map(st => (
                    <button
                      key={st.value}
                      onClick={() => setSubType(st.value)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all",
                        subType === st.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-border/80"
                      )}
                    >
                      <st.Icon className="size-5 mb-2" />
                      <div className="text-sm font-semibold">{st.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Section: Details ─────────────────────────── */}
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Детали</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Основная информация</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold">Заголовок *</Label>
              <Input
                placeholder="Например: MacBook Air M1, 8GB/256GB"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/80</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold">Категория *</Label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Выберите категорию</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {showPrice && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-semibold">Цена (₸)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0 = договорная"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">₸</span>
                  </div>
                  {price && Number(price) > 0 && (
                    <p className="text-xs text-primary font-mono">{formatPrice(Number(price))}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold">Описание *</Label>
              <Textarea
                placeholder="Подробно опишите ваш товар, услугу или ситуацию..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>
          </section>

          {/* ── Section: Images ─────────────────────────── */}
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Фотографии</h2>
              <p className="text-xs text-muted-foreground mt-0.5">До 5 изображений</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              className="group border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-sm font-semibold text-foreground">
                Перетащите фото или нажмите
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG до 5 МБ — максимум 5 файлов
              </p>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setImages(prev => prev.filter((_, j) => j !== i));
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Section: Location (Lost & Found) ─────────── */}
          {isLostFound && (
            <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 ck-animate-in">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-primary" /> Место
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Где потерял / нашёл вещь
                </p>
              </div>

              <Input
                placeholder="Например: библиотека, 3-й этаж"
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
              />
            </section>
          )}

          {/* ── Publish ─────────────────────────────────── */}
          <Button
            onClick={handlePublish}
            disabled={publishing || !canPublish}
            className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-primary-foreground ck-primary-glow"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Публикуем...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Опубликовать
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
