/**
 * usePagination — Generic pagination state management
 */

import { useState, useCallback } from "react";
import { PAGINATION } from "@/lib/constants";

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePagination({ initialPage = 1, pageSize = PAGINATION.TRIPS_PER_PAGE }: UsePaginationOptions = {}) {
  const [page, setPage]   = useState(initialPage);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1);
  }, [hasPrev]);

  const goToPage = useCallback((n: number) => {
    if (n >= 1 && n <= totalPages) setPage(n);
  }, [totalPages]);

  const reset = useCallback(() => setPage(initialPage), [initialPage]);

  return {
    page, total, pageSize, totalPages,
    hasNext, hasPrev,
    setTotal, nextPage, prevPage, goToPage, reset,
    offset: (page - 1) * pageSize,
  };
}

export default usePagination;
