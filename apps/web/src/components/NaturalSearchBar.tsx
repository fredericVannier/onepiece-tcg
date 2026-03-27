import { useState, useRef } from "react";
import { searchNatural } from "../api/cards.api";
import type { SetInfo } from "../api/cards.api";

type Props = {
  onFilters: (filters: {
    name?: string;
    color?: string;
    rarity?: string;
    card_type?: string;
    cardSet?: string;
  }) => void;
  sets: SetInfo[];
};

type State = "idle" | "loading" | "done" | "error";

export function NaturalSearchBar({ onFilters }: Props) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>("idle");
  const [lastFilters, setLastFilters] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState("loading");
    try {
      const filters = await searchNatural(q);
      setLastFilters(buildSummary(filters));
      onFilters({
        name: filters.name || undefined,
        color: filters.color || undefined,
        rarity: filters.rarity || undefined,
        card_type: filters.card_type || undefined,
        cardSet: filters.card_set || undefined,
      });
      setState("done");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") setState("error");
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        {/* Sparkle icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='AI: "luffy rouge pas cher", "leaders OP01"…'
          className="w-full border border-purple-300 dark:border-purple-700 rounded-lg pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setState("idle"); setLastFilters(""); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={state === "loading" || !query.trim()}
        className="shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
      >
        {state === "loading" ? (
          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
        Search
      </button>

      {/* Feedback line */}
      {state === "done" && lastFilters && (
        <span className="text-[10px] text-purple-500 dark:text-purple-400 whitespace-nowrap hidden sm:block">
          {lastFilters}
        </span>
      )}
      {state === "error" && (
        <span className="text-[10px] text-red-500 whitespace-nowrap hidden sm:block">
          AI unavailable
        </span>
      )}
    </form>
  );
}

function buildSummary(f: { name: string; color: string; rarity: string; card_type: string; card_set: string }) {
  const parts: string[] = [];
  if (f.name) parts.push(`name="${f.name}"`);
  if (f.color) parts.push(f.color);
  if (f.rarity) parts.push(f.rarity);
  if (f.card_type) parts.push(f.card_type);
  if (f.card_set) parts.push(f.card_set);
  return parts.join(" · ");
}
