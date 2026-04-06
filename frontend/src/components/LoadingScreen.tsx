/* comunikit — LoadingScreen
   Reusable loading spinner using Boxes (brand icon).
   Usage:
     <LoadingScreen />           — inline (200px height)
     <LoadingScreen fullPage />  — full-screen with bg-black
*/
import { Boxes } from "lucide-react";

interface LoadingScreenProps {
  fullPage?: boolean;
}

export default function LoadingScreen({ fullPage }: LoadingScreenProps) {
  if (fullPage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Boxes className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Boxes className="w-10 h-10 text-primary animate-spin" />
    </div>
  );
}
