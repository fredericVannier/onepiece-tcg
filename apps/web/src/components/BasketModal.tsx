import { useState } from "react";
import { useBasket } from "../context/BasketContext";

type SendState = "idle" | "sending" | "sent" | "error";

const RARITY_ORDER = ["L", "SR", "R", "UC", "C"];

function QtyButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 flex items-center justify-center text-sm font-bold transition-colors"
    >
      {children}
    </button>
  );
}

export function BasketModal({ onClose }: { onClose: () => void }) {
  const { entries, totalQty, totalPrice, add, decrement, remove, clear } = useBasket();
  const [sendState, setSendState] = useState<SendState>("idle");
  const [confirmClear, setConfirmClear] = useState(false);

  /* Rarity breakdown */
  const rarityMap = entries.reduce<Record<string, number>>((acc, { card, qty }) => {
    acc[card.rarity] = (acc[card.rarity] ?? 0) + qty;
    return acc;
  }, {});
  const rarityBreakdown = RARITY_ORDER.filter((r) => rarityMap[r]);

  const sendDevis = async () => {
    setSendState("sending");
    try {
      const res = await fetch("http://localhost:8080/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: entries.map(({ card, qty }) => ({
            external_id: card.external_id,
            name: card.name,
            rarity: card.rarity,
            price: card.price,
            qty,
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-none">
              Basket
            </h2>
            {totalQty > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {totalQty} card{totalQty !== 1 ? "s" : ""}
                {rarityBreakdown.length > 0 && (
                  <> · {rarityBreakdown.map((r) => `${r} ×${rarityMap[r]}`).join(" · ")}</>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && !confirmClear && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear all
              </button>
            )}
            {confirmClear && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Are you sure?</span>
                <button
                  onClick={() => { clear(); setConfirmClear(false); }}
                  className="text-red-500 font-semibold hover:underline"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-gray-400 hover:underline"
                >
                  No
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none ml-1"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Items ── */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 dark:text-gray-600">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">Your basket is empty</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
              {entries.map(({ card, qty }) => (
                <li key={card.id} className="flex items-center gap-3 py-3">
                  {/* Thumbnail */}
                  <img
                    src={`http://localhost:8080/images/${card.external_id.replace("#", "")}`}
                    alt={card.name}
                    className="w-10 h-14 object-contain rounded-lg shrink-0 bg-gray-100 dark:bg-gray-700"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                      {card.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {card.rarity}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {card.external_id.replace("#", "")}
                      </span>
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <QtyButton onClick={() => decrement(card.id)}>−</QtyButton>
                    <span className="w-5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                      {qty}
                    </span>
                    <QtyButton onClick={() => add(card)}>+</QtyButton>
                  </div>

                  {/* Line price */}
                  <div className="w-16 text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {(card.price * qty).toFixed(2)} €
                    </p>
                    {qty > 1 && (
                      <p className="text-[10px] text-gray-400">
                        {card.price.toFixed(2)} € each
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => remove(card.id)}
                    aria-label="Remove from basket"
                    className="shrink-0 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        {entries.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 flex flex-col gap-3">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total ({totalQty} card{totalQty !== 1 ? "s" : ""})
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {totalPrice.toFixed(2)} €
              </span>
            </div>

            {/* CTA */}
            {sendState === "sent" ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600 dark:text-green-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-sm font-medium">Devis envoyé !</span>
              </div>
            ) : (
              <button
                onClick={sendDevis}
                disabled={sendState === "sending"}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
              >
                {sendState === "sending" ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Envoyer le devis par email
                  </>
                )}
              </button>
            )}

            {sendState === "error" && (
              <p className="text-center text-xs text-red-500">
                Échec de l'envoi — vérifiez la config SMTP dans .env.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
