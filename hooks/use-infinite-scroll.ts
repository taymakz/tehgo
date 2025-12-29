"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ApiFilterResultType } from "@/types/request";
import { fetchApi } from "@/lib/request";

interface UseInfiniteScrollOptions {
  endpoint: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
  take?: number;
  enabled?: boolean;
  estimateSize?: number;
  overscan?: number;
}

export function useInfiniteScroll<T>({
  endpoint,
  filters = {},
  take = 10,
  enabled = true,
  estimateSize = 100,
  overscan = 5,
}: UseInfiniteScrollOptions) {
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    status,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [endpoint, filters, take],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const filteredParams: Record<string, string> = Object.fromEntries(
        Object.entries({ ...filters, page: pageParam, take: String(take) })
          .filter(([_, value]) => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== "" && value !== null && value !== undefined;
          })
          .map(([key, value]) => [key, String(value)]),
      );

      const queryParams = new URLSearchParams(filteredParams).toString();
      const response = await fetchApi<ApiFilterResultType<T>>(
        `${endpoint}/?${queryParams}`,
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch data");
      }

      return response.data;
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      return lastPage.has_next ? lastPageParam + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
  });

  // Flatten all pages into a single array
  const dataList = data?.pages.flatMap((page) => page.data) ?? [];
  const entityCount = data?.pages[0]?.entity_count ?? null;

  // Setup virtualizer with window scroll
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? dataList.length + 1 : dataList.length,
    getScrollElement: () =>
      typeof window !== "undefined" ? window.document.body : null,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Fetch next page when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= dataList.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    dataList.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  return {
    dataList,
    entityCount,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isError,
    error,
    status,
    parentRef,
    rowVirtualizer,
    resultCount: dataList.length,
    refetch,
    isRefetching,
  };
}
