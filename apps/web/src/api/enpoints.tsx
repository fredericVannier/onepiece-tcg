import type { Card } from "../types";

export async function fetchCards(): Promise<Card[]> {
  const response = await fetch("http://localhost:8080/cards");

  if (!response.ok) {
    throw new Error("Failed to fetch cards");
  }

  return response.json();
}
