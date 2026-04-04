// comunikit — listings query hook
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Listing } from "@/lib/mockData";

export function useListings() {
  const { data, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: () => apiFetch<Listing[]>("/api/listings"),
  });

  return {
    listings: data ?? [],
    isLoading,
    error,
  };
}
