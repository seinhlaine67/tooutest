import { callEdgeFunction } from "../lib/supabase";
import type { Series } from "../lib/types";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

interface SeriesListResponse {
  data: Series[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

interface seriesListProps {
  content_type?: "novel" | "webtoon";
  genre?: string;
  sort_by?: "latest" | "popular" | "trending";
}

export function useSeriesList(filters: seriesListProps) {
  const queryDTO = {};
  if (filters.content_type) queryDTO["content_type"] = filters.content_type;
  if (filters.genre) queryDTO["genre"] = filters.genre;
  if (filters.sort_by) queryDTO["sort_by"] = filters.sort_by;
  return useInfiniteQuery<SeriesListResponse>({
    queryKey: ["series-list", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return callEdgeFunction<SeriesListResponse>("get-series-list", {
        queryParams: {
          ...queryDTO,
          page: pageParam,
          limit: 20,
        },
      });
    },
    getNextPageParam: (lastpage) => {
      return lastpage.pagination.has_next
        ? lastpage.pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

export function useSeriesDetail(slug: string) {
  return useQuery({
    queryKey: ["series-detail", slug],
    queryFn: async () => {
      return callEdgeFunction("get-series-detail", {
        queryParams: { slug },
        method: "GET",
      });
    },
    enabled: !!slug,
  });
}

export function useBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (seriesId: string) =>
      callEdgeFunction<{ isBookmarked: boolean }>("toggle-bookmark", {
        payload: { series_id: seriesId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series-detail"] });
      queryClient.invalidateQueries({ queryKey: ["series-list"] });
      queryClient.invalidateQueries({ queryKey: ["user-library"] });
    },
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creatorId: string) =>
      callEdgeFunction<{ isFollowing: boolean }>("toggle-follow", {
        payload: { creator_id: creatorId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series-detail"] });
      queryClient.invalidateQueries({ queryKey: ["series-list"] });
    },
  });
}
