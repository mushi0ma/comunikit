import { Suspense } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AituMapContext, type MapMarker } from "./AituMapContext";
import { FLOOR_COMPONENTS } from "./floors";
import { cn } from "@/lib/utils";

interface AituMapProps {
  floor: string;
  markers?: MapMarker[];
  onRoomClick?: (roomId: string) => void;
  className?: string;
}

export default function AituMap({
  floor,
  markers = [],
  onRoomClick,
  className,
}: AituMapProps) {
  const FloorComponent = FLOOR_COMPONENTS[floor];

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    let el = e.target as Element | null;
    while (el && el !== e.currentTarget) {
      if (el.tagName === "g" && el.getAttribute("data-name")) {
        onRoomClick?.(el.getAttribute("data-name")!);
        return;
      }
      el = el.parentElement;
    }
  }

  return (
    <AituMapContext.Provider value={{ markers, onRoomClick }}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-[#363636]",
          className
        )}
        onClick={handleClick}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={8}
          centerOnInit
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Загрузка карты…
                  </div>
                }
              >
                {FloorComponent ? (
                  <FloorComponent />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Карта недоступна
                  </div>
                )}
              </Suspense>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </AituMapContext.Provider>
  );
}

export type { MapMarker };
