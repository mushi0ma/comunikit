/* comunikit — CreateListing (RunPod-inspired single-page form)
   Design: clean card sections, option cards, dashed upload zone
*/
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Upload, X, MapPin, Loader2, Send,
  ShoppingBag, Search, Banknote, ShoppingCart, Wrench,
} from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { CATEGORIES, formatPrice } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { resolveLocation } from "@/lib/locationUtils";
import { toast } from "sonner";

type MainType = "marketplace" | "lostfound";
type SubType = "sell" | "buy" | "service" | "lost" | "found";

function useMainTypes(t: (key: string) => string) {
  return [
    { value: "marketplace" as const, label: t("createListing.marketplace"), Icon: ShoppingBag, desc: t("createListing.marketplaceDesc") },
    { value: "lostfound" as const,   label: t("createListing.lostFound"), Icon: Search,      desc: t("createListing.lostFoundDesc") },
  ];
}

function useSubTypes(t: (key: string) => string): Record<MainType, { value: SubType; label: string; Icon: React.ElementType }[]> {
  return {
    marketplace: [
      { value: "sell",    label: t("createListing.sell"),    Icon: Banknote },
      { value: "buy",     label: t("createListing.buy"),     Icon: ShoppingCart },
      { value: "service", label: t("createListing.service"), Icon: Wrench },
    ],
    lostfound: [
      { value: "lost",  label: t("createListing.lost"),  Icon: Search },
      { value: "found", label: t("createListing.found"), Icon: Search },
    ],
  };
}

import { BASE_URL as API_URL } from "@/lib/api";

export default function CreateListing() {
  const { t } = useTranslation();
  const MAIN_TYPES = useMainTypes(t);
  const SUB_TYPES = useSubTypes(t);
  const [, navigate] = useLocation();
  const [mainType, setMainType] = useState<MainType | null>(null);
  const [subType, setSubType] = useState<SubType | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [locationText, setLocationText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Pre-fill from map query params ─────────────────────── */
  const searchString = useSearch();
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const mapType = params.get("type");
    const mapX = params.get("mapX");
    const mapY = params.get("mapY");
    const mapFloor = params.get("floor");
    if (mapType === "lost" || mapType === "found") {
      setMainType("lostfound");
      setSubType(mapType);
    }
    if (mapX && mapY) {
      const floor = mapFloor ? Number(mapFloor) : 1;
      const resolved = resolveLocation(Number(mapX), Number(mapY), floor);
      setLocationText(resolved.text);
    }
  }, [searchString]);

  const isLostFound = mainType === "lostfound";
  const showPrice = subType === "sell" || subType === "service";

  const handleImageUpload = async (files: File[]) => {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalid = files.filter(f => !ALLOWED.includes(f.type));
    if (invalid.length > 0) {
      toast.error(t("createListing.unsupportedFormat"));
      return;
    }
    const tooBig = files.filter(f => f.size > 5 * 1024 * 1024);
    if (tooBig.length > 0) {
      toast.error(t("createListing.fileTooBig"));
      return;
    }
    if (imageUrls.length + files.length > 5) {
      toast.error(t("createListing.maxPhotos"));
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(f => uploadImage(f, "listing_images", "listings"))
      );
      setImageUrls(prev => [...prev, ...urls]);
    } catch {
      toast.error(t("createListing.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    void handleImageUpload(Array.from(e.dataTransfer.files));
  };

  const canPublish =
    !!mainType && !!subType && title.length >= 5 && !!category && description.length >= 10;

  const handlePublish = async () => {
    if (!canPublish || !subType) {
      toast.error(t("createListing.fillRequired"));
      return;
    }
    setPublishing(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (session?.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      if (!session?.access_token) {
        toast.error(t("createListing.loginToPublish"));
        setPublishing(false);
        return;
      }

      const payload = {
        title,
        description,
        type: subType,
        category,
        ...(showPrice && price && Number(price) > 0 ? { price: Number(price) } : {}),
        ...(locationText ? { location: locationText } : {}),
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
      };

      let token = session.access_token;
      let res = await fetch(`${API_URL}/api/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // Retry once on 401 — token may have expired while user filled the form.
      if (res.status === 401) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed.session) {
          token = refreshed.session.access_token;
          res = await fetch(`${API_URL}/api/listings`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      }

      const result = await res.json() as { success: boolean; data?: { id: string }; error?: string };
      if (!res.ok) {
        throw new Error(result.error ?? `HTTP ${res.status}`);
      }

      toast.success(t("createListing.published"));
      navigate(result.data?.id ? `/listing/${result.data.id}` : "/marketplace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("createListing.publishError"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AppLayout title={t("createListing.title")}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate("/marketplace")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("createListing.backToFeed")}
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-black text-foreground mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            {t("createListing.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("createListing.subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-6 ck-animate-in">
          {/* ── Section: Type ───────────────────────────── */}
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground">{t("createListing.listingType")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("createListing.chooseCategory")}</p>
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
                  {t("createListing.specify")}
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
              <h2 className="text-base font-bold text-foreground">{t("createListing.details")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("createListing.mainInfo")}</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold">{t("createListing.titleLabel")} *</Label>
              <Input
                placeholder={t("createListing.titlePlaceholder")}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/80</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold">{t("createListing.categoryLabel")} *</Label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{t("createListing.selectCategory")}</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {showPrice && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-semibold">{t("createListing.price")}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder={t("createListing.pricePlaceholder")}
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
              <Label className="text-sm font-semibold">{t("createListing.descriptionLabel")} *</Label>
              <Textarea
                placeholder={t("createListing.descriptionPlaceholder")}
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
              <h2 className="text-base font-bold text-foreground">{t("createListing.photos")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("createListing.upTo5")}</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => void handleImageUpload(Array.from(e.target.files || []))}
            />

            <div className="relative">
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl z-10">
                  <Loader2 className="size-6 text-primary animate-spin" />
                </div>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className="group border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm font-semibold text-foreground">
                  {t("createListing.dropOrClick")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("createListing.photoHint")}
                </p>
              </div>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setImageUrls(prev => prev.filter((_, j) => j !== i));
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
                  <MapPin className="size-4 text-primary" /> {t("createListing.location")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("createListing.locationHint")}
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
                {t("createListing.publishing")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("createListing.publish")}
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
