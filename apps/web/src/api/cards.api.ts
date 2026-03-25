import type { Card } from "../types/card.ts";

export type CardsResponse = {
  data: Card[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchCards(params: URLSearchParams, signal?: AbortSignal) {
  const res = await fetch(`http://localhost:8080/cards?${params.toString()}`, { signal });

  return res.json() as Promise<CardsResponse>;
}

export type SetInfo = { code: string; name: string };

export async function fetchSets(): Promise<SetInfo[]> {
  const res = await fetch("http://localhost:8080/sets");
  return res.json();
}

// export async function fetchCards(
//   params: Readonly<Record<string, string | undefined>>,
// ) {
//   const searchParams = new URLSearchParams(
//     Object.entries(params).filter(
//       (entry): entry is [string, string] => entry[1] !== undefined,
//     ),
//   );
//   const res = await fetch(
//     `http://localhost:8080/cards?${searchParams.toString()}`,
//   );
//
//   if (!res.ok) {
//     throw new Error("Failed to fetch cards");
//   }
//
//   return res.json() as Promise<CardsResponse>;
// }
