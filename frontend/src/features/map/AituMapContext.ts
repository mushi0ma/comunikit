import { createContext } from "react";

export type MapMarker = {
  roomId: string;
  type: "lost" | "found";
  listingId: string;
  title: string;
};

interface AituMapContextValue {
  markers: MapMarker[];
  onRoomClick?: (roomId: string) => void;
}

export const AituMapContext = createContext<AituMapContextValue>({
  markers: [],
});
