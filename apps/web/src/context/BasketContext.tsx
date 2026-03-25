import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Card } from "../types/card";

export type BasketEntry = { card: Card; qty: number };

type BasketContextType = {
  entries: BasketEntry[];
  totalQty: number;
  totalPrice: number;
  add: (card: Card) => void;
  decrement: (id: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  qty: (id: number) => number;
  has: (id: number) => boolean;
};

const BasketContext = createContext<BasketContextType | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<BasketEntry[]>([]);

  const add = useCallback((card: Card) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.card.id === card.id);
      if (existing) return prev.map((e) => e.card.id === card.id ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { card, qty: 1 }];
    });
  }, []);

  const decrement = useCallback((id: number) => {
    setEntries((prev) =>
      prev
        .map((e) => e.card.id === id ? { ...e, qty: e.qty - 1 } : e)
        .filter((e) => e.qty > 0),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.card.id !== id));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const qty = useCallback(
    (id: number) => entries.find((e) => e.card.id === id)?.qty ?? 0,
    [entries],
  );

  const has = useCallback((id: number) => entries.some((e) => e.card.id === id), [entries]);

  const totalQty = useMemo(() => entries.reduce((s, e) => s + e.qty, 0), [entries]);
  const totalPrice = useMemo(
    () => entries.reduce((s, e) => s + e.card.price * e.qty, 0),
    [entries],
  );

  return (
    <BasketContext.Provider value={{ entries, totalQty, totalPrice, add, decrement, remove, clear, qty, has }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside BasketProvider");
  return ctx;
}
