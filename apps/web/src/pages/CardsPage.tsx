import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSets, type SetInfo } from "../api/cards.api";
import { CardFilters } from "../components/Cardfilters";
import { CardModal } from "../components/CardModal";
import { InfiniteScrollTrigger } from "../components/InfiniteScrollTrigger";
import { useCards } from "../hooks/useCards";
import type { Card } from "../types/card";

const COLOR_DOT: Record<string, string> = {
  Red: "bg-red-500",
  Blue: "bg-blue-500",
  Green: "bg-green-500",
  Purple: "bg-purple-500",
  Yellow: "bg-yellow-400",
  Black: "bg-gray-800",
};

export function CardsPage() {
  const [params, setParams] = useSearchParams();
  const { cards, loadMore, hasMore, loading } = useCards(params);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [sets, setSets] = useState<SetInfo[]>([]);

  useEffect(() => {
    fetchSets().then(setSets).catch(console.error);
  }, []);

  const primaryColor = (color: string) => color.split("/")[0].trim();

  return (
    <>
      <div className="flex flex-col gap-4 pt-6">
        <CardFilters params={params} setParams={setParams} sets={sets} />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-150"
            >
              <img
                src={`http://localhost:8080/images/${card.external_id.replace("#", "")}`}
                alt={card.name}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{card.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${COLOR_DOT[primaryColor(card.color)] ?? "bg-gray-400"}`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{card.rarity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <p className="text-center text-sm text-gray-400 py-4">Loading…</p>
        )}
      </div>

      {hasMore && !loading && <InfiniteScrollTrigger onVisible={loadMore} />}

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </>
  );
}
