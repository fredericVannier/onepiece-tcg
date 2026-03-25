import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../types/card";
import { fetchCards } from "../api/cards.api";

export function useCards(searchParams: URLSearchParams) {
  const [cards, setCards] = useState<Card[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Refs for synchronous guard checks inside callbacks (avoids stale closure bugs)
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const paramsString = searchParams.toString();

  // 1. Reset when filters change, cancel any in-flight request
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    loadingRef.current = false;
    hasMoreRef.current = true;
    setLoading(false);
    setCards([]);
    setPage(1);
    setHasMore(true);
  }, [paramsString]);

  // 2. Stabilised load function
  const loadCards = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    loadingRef.current = true;
    setLoading(true);

    try {
      const copyParams = new URLSearchParams(paramsString);
      copyParams.set("page", page.toString());
      copyParams.set("limit", "20");

      const res = await fetchCards(copyParams, controller.signal);

      if (controller.signal.aborted) return;

      setCards((prev) => [...prev, ...res.data]);
      const more = res.data.length > 0;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error(error);
      }
    } finally {
      if (!controller.signal.aborted) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [page, paramsString]);

  // 3. Trigger fetch
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const loadMore = useCallback(() => setPage((p) => p + 1), []);

  return { cards, loadMore, hasMore, loading };
} // import type { Card } from "../types/card";
// import { useEffect, useState } from "react";
// import { fetchCards } from "../api/cards.api";
//
// export function useCards(searchParams: URLSearchParams) {
//   const [cards, setCards] = useState<Card[]>([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loading, setLoading] = useState(false);
//   console.log("cards 1: ", cards);
//
//   const params = searchParams.toString();
//
//   useEffect(() => {
//     setCards([]);
//     setPage(1);
//     setHasMore(true);
//   }, [params]);
//
//   async function loadCards() {
//     if (loading || !hasMore) return;
//
//     setLoading(true);
//
//     const params = new URLSearchParams(searchParams);
//     params.set("page", page.toString());
//     params.set("limit", "20");
//
//     const res = await fetchCards(params);
//
//     console.log("res: ", res);
//     setCards((prev) => [...prev, ...res.data]);
//     setHasMore(res.data.length > 0);
//     setLoading(false);
//   }
//   console.log("cards 2: ", cards);
//
//   useEffect(() => {
//     loadCards();
//   }, [page, params, loadCards]);
//
//   return { cards, loadMore: () => setPage((p) => p + 1), hasMore };
// }
