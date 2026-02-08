import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import type { ModuleConfig } from "../../types/api";

interface Props {
  availableModules: string[];
  configModules: ModuleConfig[];
  onToggle: (name: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onFetch: (planName: string) => void;
}

export default function AvailableModulesPanel({
  availableModules,
  configModules,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onFetch,
}: Props) {
  const [planName, setPlanName] = useState("");
  const [filter, setFilter] = useState("");

  const configNames = configModules.map((m) => m.name);

  const allNames = [...new Set([...availableModules, ...configNames])].sort();
  const filtered = filter
    ? allNames.filter((n) => n.toLowerCase().includes(filter.toLowerCase()))
    : allNames;

  return (
    <>
      <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
        <TextField
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="e.g. fapi1-advanced-final-test-plan"
          size="small"
          fullWidth
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => onFetch(planName.trim())}
          sx={{ whiteSpace: "nowrap" }}
        >
          Fetch
        </Button>
      </Stack>
      <TextField
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter modules..."
        size="small"
        fullWidth
        sx={{ mb: 1 }}
      />
      <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
        <Button variant="text" size="small" onClick={onSelectAll}>
          Select All
        </Button>
        <Button variant="text" size="small" onClick={onDeselectAll}>
          Deselect All
        </Button>
      </Stack>
      <Box
        sx={{
          maxHeight: 300,
          overflowY: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
            No modules found. Enter a plan name and click Fetch.
          </Typography>
        )}
        <List dense disablePadding>
          {filtered.map((name) => {
            const checked = configNames.includes(name);
            return (
              <ListItemButton
                key={name}
                onClick={() => onToggle(name, !checked)}
                selected={checked}
                sx={{ py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Checkbox
                    edge="start"
                    checked={checked}
                    size="small"
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  slotProps={{
                    primary: {
                      variant: "body2",
                      noWrap: true,
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>
    </>
  );
}
