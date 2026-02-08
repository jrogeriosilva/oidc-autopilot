import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  message: string;
  isError: boolean;
}

export default function StatusBar({ message, isError }: Props) {
  return (
    <Box
      component="footer"
      sx={{
        flexShrink: 0,
        px: 3,
        py: 0.75,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" color={isError ? "error" : "success.main"}>
        {message}
      </Typography>
    </Box>
  );
}
