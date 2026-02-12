import { useEffect, useState, type FC } from "react";
import type { Card } from "../../types";
import { fetchCards } from "../../api/enpoints";

export const Home: FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards()
      .then((data) => {
        console.log("data: ", data);
        setCards(data);
      })
      .finally(() => setLoading(false));
  }, []);

  console.log("cards : ", cards);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Cards</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.ID}
            style={{ border: "1px solid #ccc", padding: "8px" }}
          >
            <img src={card.ImageURL} alt={card.Name} width="100%" />
            <h3>{card.Name}</h3>
            <p>{card.Color}</p>
            <p>Cost: {card.Cost}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
