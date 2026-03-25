import { useBasket } from "../context/BasketContext";
import type { Card } from "../types/card";

const COLOR_BADGE: Record<string, string> = {
  Red: "bg-red-100 text-red-700",
  Blue: "bg-blue-100 text-blue-700",
  Green: "bg-green-100 text-green-700",
  Purple: "bg-purple-100 text-purple-700",
  Yellow: "bg-yellow-100 text-yellow-700",
  Black: "bg-gray-800 text-white",
};

function ColorBadges({ color }: { color: string }) {
  const colors = color.split("/").map((c) => c.trim());
  return (
    <div className="flex flex-wrap gap-1">
      {colors.map((c) => (
        <span
          key={c}
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLOR_BADGE[c] ?? "bg-gray-100 text-gray-700"}`}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

type Props = {
  card: Card | null;
  onClose: () => void;
};

export function CardModal({ card, onClose }: Props) {
  const { add, remove, has } = useBasket();
  if (!card) return null;

  const inBasket = has(card.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full flex flex-col sm:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="sm:w-72 shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img
            src={`http://localhost:8080/images/${card.external_id.replace("#", "")}`}
            alt={card.name}
            className="w-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{card.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex items-center justify-between">
            <ColorBadges color={card.color} />
            {card.price > 0 && (
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {card.price.toFixed(2)} €
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Rarity</span>
              <span className="font-medium dark:text-white">{card.rarity}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Type</span>
              <span className="font-medium dark:text-white">{card.card_type || "—"}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Cost</span>
              <span className="font-medium dark:text-white">{card.cost || "—"}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Power</span>
              <span className="font-medium dark:text-white">{card.power || "—"}</span>
            </div>
            {card.attribute && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <span className="text-gray-500 dark:text-gray-400 block text-xs">Attribute</span>
                <span className="font-medium dark:text-white">{card.attribute}</span>
              </div>
            )}
            {card.counter && card.counter !== "-" && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <span className="text-gray-500 dark:text-gray-400 block text-xs">Counter</span>
                <span className="font-medium dark:text-white">{card.counter}</span>
              </div>
            )}
          </div>

          {card.effect && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Effect</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{card.effect}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="text-xs text-gray-400">{card.external_id}</div>
            <button
              onClick={() => (inBasket ? remove(card.id) : add(card))}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                inBasket
                  ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  : "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              }`}
            >
              {inBasket ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Remove
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add to basket
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
