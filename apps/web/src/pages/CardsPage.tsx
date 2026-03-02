import { useSearchParams } from "react-router-dom";
import { InfiniteScrollTrigger } from "../components/InfiniteScrollTrigger";
import { useCards } from "../hooks/useCards";
import { CardFilters } from "../components/Cardfilters";

export function CardsPage() {
  const [params, setParams] = useSearchParams();
  const { cards, loadMore, hasMore } = useCards(params);
  console.log("cards: ", cards);

  return (
    <>
      <div className="flex gap-4 flex-col">
        <CardFilters params={params} setParams={setParams} />
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id}>
              <img src={card.image_url} alt={card.name} width="100%" />
              <h3>{card.name}</h3>
              <p>{card.color}</p>
              <p>Cost: {card.cost}</p>
            </div>
          ))}
        </div>
      </div>

      {hasMore && <InfiniteScrollTrigger onVisible={loadMore} />}
    </>
  );
}
