import { createContext, useCallback, useContext, useState } from "react";
import type { Card } from "../types/card";

type BasketContextType = {
  items: Card[];
  add: (card: Card) => void;
  remove: (id: number) => void;
  has: (id: number) => boolean;
};

const BasketContext = createContext<BasketContextType | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Card[]>([]);

  const add = useCallback((card: Card) => {
    setItems((prev) => (prev.some((c) => c.id === card.id) ? prev : [...prev, card]));
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const has = useCallback((id: number) => items.some((c) => c.id === id), [items]);

  return (
    <BasketContext.Provider value={{ items, add, remove, has }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used inside BasketProvider");
  return ctx;
}
