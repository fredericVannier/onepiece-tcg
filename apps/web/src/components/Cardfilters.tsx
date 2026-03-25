import type { SetInfo } from "../api/cards.api";

type Props = {
  params: URLSearchParams;
  setParams: (p: URLSearchParams) => void;
  sets: SetInfo[];
};

export function CardFilters({ params, setParams, sets }: Props) {
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center w-full overflow-hidden">
      <div className="relative flex-1 min-w-[180px]">
        <input
          placeholder="Search card..."
          value={params.get("name") ?? ""}
          onChange={(e) => update("name", e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {params.get("name") && (
          <button
            onClick={() => update("name", "")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <select
        value={params.get("cardSet") ?? ""}
        onChange={(e) => update("cardSet", e.target.value)}
        className="w-full sm:w-auto min-w-0 max-w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 pr-6 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All sets</option>
        {sets.map(({ code, name }) => (
          <option key={code} value={code}>
            {formatSet(code)}{name ? ` – ${name}` : ""}
          </option>
        ))}
      </select>

      <select
        value={params.get("color") ?? ""}
        onChange={(e) => update("color", e.target.value)}
        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 pr-6 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All colors</option>
        <option value="Red">Red</option>
        <option value="Green">Green</option>
        <option value="Blue">Blue</option>
        <option value="Purple">Purple</option>
        <option value="Yellow">Yellow</option>
        <option value="Black">Black</option>
      </select>

      <select
        value={params.get("rarity") ?? ""}
        onChange={(e) => update("rarity", e.target.value)}
        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 pr-6 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All rarities</option>
        <option value="L">Leader</option>
        <option value="SR">SR</option>
        <option value="R">R</option>
        <option value="UC">UC</option>
        <option value="C">C</option>
      </select>
    </div>
  );
}

// "OP01" → "OP-01", "ST01" → "ST-01", "PRB01" → "PRB-01"
function formatSet(code: string): string {
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (!match) return code;
  return `${match[1]}-${match[2]}`;
}
