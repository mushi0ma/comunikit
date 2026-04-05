// comunikit — listings query hook
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { MOCK_LISTINGS, type Listing } from "@/lib/mockData";

export function useListings() {
  const { data, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: () => apiFetch<Listing[]>("/api/listings"),
  });

  const apiListings = data ?? [];
  const listings = apiListings.length > 0 ? apiListings : MOCK_LISTINGS;

  return {
    listings,
    isLoading,
    error,
  };
}
