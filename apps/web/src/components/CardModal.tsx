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
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full flex flex-col sm:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="sm:w-56 shrink-0 bg-gray-100 dark:bg-gray-700">
          <img
            src={`http://localhost:8080/images/${card.external_id.replace("#", "")}`}
            alt={card.name}
            className="w-full h-full object-cover"
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

          <ColorBadges color={card.color} />

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

          <div className="text-xs text-gray-400 mt-auto">{card.external_id}</div>
        </div>
      </div>
    </div>
  );
}
