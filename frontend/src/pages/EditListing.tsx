import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Upload, X, Loader2, Save,
} from "lucide-react";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/AppLayout";
import { CATEGORIES, formatPrice, type Listing } from "@/lib/mockData";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import LoadingScreen from "@/components/LoadingScreen";

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [location, setLocationText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: () => apiFetch<Listing>(`/api/listings/${id}`),
    enabled: !!id,
  });

  // Pre-fill form when listing loads
  useEffect(() => {
    if (listing && !initialized) {
      setTitle(listing.title);
      setCategory(listing.category);
      setPrice(listing.price ? String(listing.price) : "");
      setDescription(listing.description);
      setImageUrls(listing.images ?? []);
      setLocationText(listing.location ?? "");
      setInitialized(true);
    }
  }, [listing, initialized]);

  const isOwner = !!(user?.id && listing?.author?.id === user.id);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/listings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Объявление обновлено");
      navigate(`/listing/${id}`);
    },
    onError: (err: Error) => toast.error(err.message || "Ошибка сохранения"),
  });

  const handleImageUpload = async (files: File[]) => {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalid = files.filter(f => !ALLOWED.includes(f.type));
    if (invalid.length > 0) {
      toast.error(`Неподдерживаемый формат: ${invalid.map(f => f.name).join(", ")}`);
      return;
    }
    if (imageUrls.length + files.length > 5) {
      toast.error("Максимум 5 фотографий");
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(f => uploadImage(f, "listing_images", "listings"))
      );
      setImageUrls(prev => [...prev, ...urls]);
    } catch {
      toast.error("Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  };

  const canSave = title.length >= 3 && !!category && description.length >= 10;

  const handleSave = () => {
    if (!canSave) return;
    const payload: Record<string, unknown> = {
      title,
      description,
      category,
      images: imageUrls,
    };
    if (price && Number(price) > 0) payload.price = Number(price);
    if (location) payload.location = location;
    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <AppLayout title="Редактирование">
        <LoadingScreen />
      </AppLayout>
    );
  }

  if (!listing) {
    return (
      <AppLayout title="Объявление не найдено">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground">Объявление не найдено</h1>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout title="Нет доступа">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground">Вы не можете редактировать это объявление</h1>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/listing/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад
          </Button>
        </div>
      </AppLayout>
    );
  }

  const showPrice = listing.type === "sell" || listing.type === "service";

  return (
    <AppLayout title="Редактирование">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/listing/${id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к объявлению
        </button>

        <div className="mb-6">
          <h1
            className="text-2xl font-black text-foreground mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Редактирование
          </h1>
          <p className="text-sm text-muted-foreground">Измените нужные поля и сохраните</p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Details */}
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Детали</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold">Заголовок *</Label>
              <Input
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
                  <Label className="text-sm font-semibold">Цена</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0 = договорная"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                      &#8376;
                    </span>
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
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>

            {(listing.type === "lost" || listing.type === "found") && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold">Место</Label>
                <Input
                  value={location}
                  onChange={e => setLocationText(e.target.value)}
                />
              </div>
            )}
          </section>

          {/* Images */}
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
                onDrop={e => { e.preventDefault(); void handleImageUpload(Array.from(e.dataTransfer.files)); }}
                className="group border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <Upload className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm font-semibold text-foreground">Перетащите фото или нажмите</p>
                <p className="text-xs text-muted-foreground">PNG, JPG до 5 МБ</p>
              </div>
            </div>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
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

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || !canSave}
            className="w-full h-12 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
