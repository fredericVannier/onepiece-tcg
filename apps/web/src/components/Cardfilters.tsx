import type { ReadonlyURLSearchParams } from "react-router-dom";

type Props = {
  params: ReadonlyURLSearchParams;
  setParams: (p: URLSearchParams) => void;
};

export function CardFilters({ params, setParams }: Props) {
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  return (
    <div className="filters flex gap-4 items-center justify-center">
      <input
        placeholder="Search card..."
        onChange={(e) => update("name", e.target.value)}
      />

      <select onChange={(e) => update("color", e.target.value)}>
        <option value="">All colors</option>
        <option value="Red">Red</option>
        <option value="Green">Green</option>
        <option value="Blue">Blue</option>
      </select>

      <select onChange={(e) => update("rarity", e.target.value)}>
        <option value="">All rarities</option>
        <option value="L">Leader</option>
        <option value="SR">SR</option>
        <option value="R">R</option>
      </select>
    </div>
  );
}
