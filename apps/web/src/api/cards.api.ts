import type { Card } from "../types/card.ts";

const API = "http://localhost:8080";

export type CardsResponse = {
  data: Card[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchCards(params: URLSearchParams, signal?: AbortSignal) {
  const res = await fetch(`${API}/cards?${params.toString()}`, { signal });
  return res.json() as Promise<CardsResponse>;
}

export type SetInfo = { code: string; name: string };

export async function fetchSets(): Promise<SetInfo[]> {
  const res = await fetch(`${API}/sets`);
  return res.json();
}

// ── Agent endpoints ────────────────────────────────────────────────────────────

export type SearchFilters = {
  name: string;
  color: string;
  rarity: string;
  card_type: string;
  card_set: string;
};

/** Convert a natural language query to structured card filters via Claude. */
export async function searchNatural(query: string): Promise<SearchFilters> {
  const res = await fetch(`${API}/search/natural`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type BasketItemForRec = {
  external_id: string;
  name: string;
  color: string;
  rarity: string;
  card_type: string;
  price: number;
};

export type Recommendation = {
  external_id: string;
  reason: string;
  card?: Card;
};

export type RecommendationResponse = {
  recommendations: Recommendation[];
  reasoning: string;
};

/** Fetch AI-powered card recommendations based on the current basket. */
export async function fetchRecommendations(
  basket: BasketItemForRec[]
): Promise<RecommendationResponse> {
  const res = await fetch(`${API}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ basket }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type DevisBasketItem = {
  external_id: string;
  name: string;
  rarity: string;
  price: number;
  qty: number;
};

/**
 * Stream a devis chat reply via SSE.
 * Calls onToken for each text delta, onDone when complete, onError on failure.
 */
export function streamChatDevis(
  messages: ChatMessage[],
  basket: DevisBasketItem[],
  onToken: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  signal?: AbortSignal
): void {
  fetch(`${API}/devis/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, basket }),
    signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        onError(await res.text());
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") { onDone(); return; }
          if (data.startsWith("[ERROR]")) { onError(data.slice(8)); return; }
          // Unescape newlines we escaped on the server side
          onToken(data.replace(/\\n/g, "\n"));
        }
      }
      onDone();
    })
    .catch((err) => {
      if (err?.name !== "AbortError") onError(String(err));
    });
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
