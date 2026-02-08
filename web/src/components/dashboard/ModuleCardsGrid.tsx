import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ModuleCard as ModuleCardType } from "../../types/api";
import ModuleCard from "./ModuleCard";

interface Props {
  cards: ModuleCardType[];
}

export default function ModuleCardsGrid({ cards }: Props) {
  if (cards.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Configure and launch a plan to see test modules here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 1.5,
        alignContent: "start",
      }}
    >
      {cards.map((card) => (
        <ModuleCard key={card.name} card={card} />
      ))}
    </Box>
  );
}
