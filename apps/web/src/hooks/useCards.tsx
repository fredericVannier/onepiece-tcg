import { useCallback, useEffect, useState } from "react";
import type { Card } from "../types/card";
import { fetchCards } from "../api/cards.api";

export function useCards(searchParams: URLSearchParams) {
  const [cards, setCards] = useState<Card[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // On transforme searchParams en string pour une comparaison stable dans les dépendances
  const paramsString = searchParams.toString();

  // 1. Reset quand les filtres changent
  useEffect(() => {
    setCards([]);
    setPage(1);
    setHasMore(true);
  }, [paramsString]);

  // 2. Fonction de chargement stabilisée
  const loadCards = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const copyParams = new URLSearchParams(paramsString);
      copyParams.set("page", page.toString());
      copyParams.set("limit", "20");

      const res = await fetchCards(copyParams);

      setCards((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length > 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, paramsString]);
  // Note: On ne met pas 'loading' ou 'hasMore' ici pour éviter les boucles,
  // on gère la sécurité à l'intérieur de la fonction.

  // 3. Déclenchement du fetch
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return { cards, loadMore: () => setPage((p) => p + 1), hasMore, loading };
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
