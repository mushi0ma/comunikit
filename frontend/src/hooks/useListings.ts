// comunikit — listings query hook (real API + mock fallback)
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { MOCK_LISTINGS, type Listing } from "@/lib/mockData";

interface ListingsFilters {
  type?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

async function fetchListings(filters: ListingsFilters = {}): Promise<Listing[]> {
  // Get current session token for authenticated requests
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const qs = params.toString();
  const path = `/api/listings${qs ? `?${qs}` : ""}`;

  const data = await apiFetch<Listing[]>(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Fallback to mock data if API returns empty array
  return data.length > 0 ? data : MOCK_LISTINGS;
}

export function useListings(filters: ListingsFilters = {}) {
  const { data, isLoading, error, refetch } = useQuery<Listing[]>({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });

  const listings = data ?? MOCK_LISTINGS;

  return {
    listings,
    isLoading,
    error,
    refetch,
  };
}
