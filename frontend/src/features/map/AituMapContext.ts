import { createContext } from "react";

export type MapMarker = {
  roomId: string;
  type: "lost" | "found";
  listingId: string;
  title: string;
};

export type PendingMarker = {
  x: number; // percentage of container width (0-100)
  y: number; // percentage of container height (0-100)
  type: "lost" | "found";
  note?: string;
};

export type MapClickPoint = { x: number; y: number };

interface AituMapContextValue {
  markers: MapMarker[];
  onRoomClick?: (roomId: string) => void;
  onMapClick?: (point: MapClickPoint) => void;
}

export const AituMapContext = createContext<AituMapContextValue>({
  markers: [],
});
