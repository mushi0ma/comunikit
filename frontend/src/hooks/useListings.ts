// comunikit — listings query hook (real API)
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Listing } from "@/lib/mockData";

interface ListingsFilters {
  type?: string;
  category?: string;
  authorId?: string;
  limit?: number;
  offset?: number;
}

async function fetchListings(filters: ListingsFilters = {}): Promise<Listing[]> {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.authorId) params.set("authorId", filters.authorId);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const qs = params.toString();
  const path = `/api/listings${qs ? `?${qs}` : ""}`;

  return apiFetch<Listing[]>(path);
}

export function useListings(filters: ListingsFilters = {}) {
  const { data, isLoading, error, refetch } = useQuery<Listing[]>({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });

  return {
    listings: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
