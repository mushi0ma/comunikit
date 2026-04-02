/* comunikit — CreateListing (multi-step form)
   Design: "Digital Bazaar" — step wizard with preview toggle
*/
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, Upload, X, Eye, EyeOff,
  CheckCircle2, MapPin, Loader2, ImagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { CATEGORIES, ListingType, formatPrice } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = 1 | 2 | 3;
type MainType = "marketplace" | "lostfound";
type SubType = "sell" | "buy" | "service" | "lost" | "found";

const STEP_LABELS = ["Тип", "Детали", "Публикация"];

export default function CreateListing() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [mainType, setMainType] = useState<MainType | null>(null);
  const [subType, setSubType] = useState<SubType | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [locationText, setLocationText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLostFound = mainType === "lostfound";

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

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise(r => setTimeout(r, 1500));
    setPublishing(false);
    toast.success("Объявление опубликовано! 🎉");
    navigate("/feed");
  };

  const handleDraft = () => {
    toast.success("Черновик сохранён");
  };

  const canProceedStep1 = mainType && subType;
  const canProceedStep2 = title.length >= 5 && category && description.length >= 10;

  return (
    <AppLayout title="Новое объявление">
      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Back */}
        <button onClick={() => step === 1 ? navigate("/feed") : setStep(s => (s - 1) as Step)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Назад к ленте" : "Назад"}
        </button>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                  step > s ? "bg-green-500 text-white" : step === s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={cn("text-xs font-semibold hidden sm:block", step === s ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < 2 && <div className={cn("h-0.5 flex-1 transition-all", step > s ? "bg-green-500" : "bg-muted")} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Type selection */}
        {step === 1 && (
          <div className="space-y-6 ck-animate-in">
            <div>
              <h2 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Тип объявления</h2>
              <p className="text-sm text-muted-foreground">Выберите категорию вашего объявления</p>
            </div>

            {/* Main type */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "marketplace", label: "Маркетплейс", emoji: "🛍️", desc: "Продать, купить или предложить услугу" },
                { value: "lostfound", label: "Lost & Found", emoji: "🔍", desc: "Потерял или нашёл вещь" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setMainType(opt.value); setSubType(null); }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all duration-150",
                    mainType === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="text-3xl mb-2">{opt.emoji}</div>
                  <div className="font-bold text-sm text-foreground">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub type */}
            {mainType && (
              <div className="space-y-2 ck-animate-in">
                <Label className="text-sm font-bold">Уточните тип</Label>
                <div className="flex flex-wrap gap-2">
                  {null}
                  {(mainType === "marketplace"
                    ? (["sell", "buy", "service"] as SubType[])
                    : (["lost", "found"] as SubType[])
                  ).map((t, i) => {
                    const labels: Record<SubType, { label: string; emoji: string }> = {
                      sell: { label: "Продам", emoji: "💰" },
                      buy: { label: "Куплю", emoji: "🛒" },
                      service: { label: "Услуга", emoji: "🔧" },
                      lost: { label: "Потерял", emoji: "🔴" },
                      found: { label: "Нашёл", emoji: "🟢" },
                    };
                    return (
                      <button
                        key={t}
                        onClick={() => setSubType(t)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all",
                          subType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <span>{labels[t].emoji}</span>
                        {labels[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              className="w-full h-11 font-bold"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              style={canProceedStep1 ? { background: "linear-gradient(135deg, #F97316, #FB923C)" } : {}}
            >
              Продолжить <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-5 ck-animate-in">
            <div>
              <h2 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Детали объявления</h2>
              <p className="text-sm text-muted-foreground">Заполните информацию об объявлении</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Заголовок *</Label>
              <Input
                placeholder="Например: MacBook Air M1, 8GB/256GB"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/80</p>
            </div>

            <div className="space-y-1.5">
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

            {(subType === "sell" || subType === "service") && (
              <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Описание *</Label>
              <Textarea
                placeholder="Подробно опишите ваш товар, услугу или ситуацию..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Фотографии (до 5)</Label>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">Добавить</span>
                  </button>
                )}
              </div>
            </div>

            {/* Location (Lost & Found) */}
            {isLostFound && (
              <div className="space-y-2 p-4 rounded-2xl border border-border bg-card">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Место (Lost & Found)
                </Label>
                <div
                  className="rounded-xl overflow-hidden h-28 relative cursor-pointer border-2 border-dashed border-border hover:border-primary transition-colors"
                  style={{
                    background: "url(https://d2xsxph8kpxj0f.cloudfront.net/310519663495884739/DGUPBTppTqo5bjNNyAy3QB/comunikit-campus-map-bg-T8ZyHrwYhDrtVNt496PAhT.webp) center/cover no-repeat"
                  }}
                  onClick={() => { setLocation("Аудитория 301, 3-й этаж"); toast.success("Место выбрано на карте"); }}
                >
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    {location ? (
                      <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="text-white text-center">
                        <MapPin className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-semibold">Нажмите, чтобы выбрать место</span>
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Описание места (например: библиотека, 3-й этаж)"
                  value={locationText}
                  onChange={e => setLocationText(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showPreview ? "Скрыть" : "Предпросмотр"}
              </Button>
              <Button
                className="flex-1 h-11 font-bold"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                style={canProceedStep2 ? { background: "linear-gradient(135deg, #F97316, #FB923C)" } : {}}
              >
                Далее <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="p-4 rounded-2xl border-2 border-primary/30 bg-card space-y-2 ck-animate-in">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">Предпросмотр</p>
                <h3 className="font-bold text-foreground">{title || "Заголовок объявления"}</h3>
                {price && <p className="ck-price text-xl">{formatPrice(Number(price))}</p>}
                <p className="text-sm text-muted-foreground line-clamp-3">{description || "Описание объявления..."}</p>
                {images[0] && <img src={images[0]} alt="" className="w-full h-32 object-cover rounded-xl" />}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <div className="space-y-5 ck-animate-in">
            <div>
              <h2 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Готово к публикации!</h2>
              <p className="text-sm text-muted-foreground">Проверьте данные перед публикацией</p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              {images[0] && <img src={images[0]} alt="" className="w-full h-40 object-cover rounded-xl" />}
              <h3 className="font-bold text-foreground">{title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{category}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {subType === "sell" ? "Продажа" : subType === "buy" ? "Покупка" : subType === "service" ? "Услуга" : subType === "lost" ? "🔴 Потеряно" : "🟢 Найдено"}
                </span>
              </div>
              {price && <p className="ck-price text-2xl">{formatPrice(Number(price))}</p>}
              <p className="text-sm text-foreground/80 line-clamp-3">{description}</p>
              {(locationText || location) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{locationText || location}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={handleDraft}>
                Сохранить черновик
              </Button>
              <Button
                className="flex-1 h-11 font-bold"
                onClick={handlePublish}
                disabled={publishing}
                style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
              >
                {publishing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Публикуем...</> : "Опубликовать 🚀"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
