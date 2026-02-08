import type { ModuleCard as ModuleCardType } from "../../types/api";
import ModuleCard from "./ModuleCard";

interface Props {
  cards: ModuleCardType[];
}

export default function ModuleCardsGrid({ cards }: Props) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[120px] text-text-muted text-sm">
        Configure and launch a plan to see test modules here.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 content-start">
      {cards.map((card) => (
        <ModuleCard key={card.name} card={card} />
      ))}
    </div>
  );
}
