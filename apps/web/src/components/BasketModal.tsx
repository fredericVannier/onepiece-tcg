import { useState } from "react";
import { useBasket } from "../context/BasketContext";

type SendState = "idle" | "sending" | "sent" | "error";

export function BasketModal({ onClose }: { onClose: () => void }) {
  const { items, remove } = useBasket();
  const [sendState, setSendState] = useState<SendState>("idle");

  const total = items.reduce((sum, c) => sum + (c.price ?? 0), 0);

  const sendDevis = async () => {
    setSendState("sending");
    try {
      const res = await fetch("http://localhost:8080/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ external_id, name, rarity, price }) => ({
            external_id,
            name,
            rarity,
            price,
          })),
        }),
      });
      setSendState(res.ok ? "sent" : "error");
    } catch {
      setSendState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Basket
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                {items.length} card{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-10 text-sm">
              Your basket is empty.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((card) => (
                <li
                  key={card.id}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-2"
                >
                  <img
                    src={`http://localhost:8080/images/${card.external_id.replace("#", "")}`}
                    alt={card.name}
                    className="w-12 h-16 object-contain rounded-lg shrink-0 bg-gray-100 dark:bg-gray-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {card.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {card.external_id} · {card.rarity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                    {card.price > 0 ? `${card.price.toFixed(2)} €` : "—"}
                  </span>
                  <button
                    onClick={() => remove(card.id)}
                    aria-label="Remove from basket"
                    className="shrink-0 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — total + send button */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {total.toFixed(2)} €
              </span>
            </div>

            {sendState === "sent" ? (
              <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium py-2">
                Devis envoyé !
              </p>
            ) : (
              <button
                onClick={sendDevis}
                disabled={sendState === "sending"}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium text-sm rounded-xl py-2.5 transition-colors"
              >
                {sendState === "sending" ? "Envoi en cours…" : "Envoyer le devis par email"}
              </button>
            )}

            {sendState === "error" && (
              <p className="text-center text-xs text-red-500">
                Échec de l'envoi. Vérifiez la configuration SMTP dans .env.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
