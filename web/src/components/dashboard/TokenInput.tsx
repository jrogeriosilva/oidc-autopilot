import { useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function TokenInput({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TextField
      label="Bearer Token"
      type={show ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="your-api-token"
      required
      size="small"
      sx={{ flex: 1, minWidth: 180 }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShow(!show)}
                edge="end"
                size="small"
                title={show ? "Hide token" : "Show token"}
              >
                {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
              <IconButton
                onClick={handleCopy}
                edge="end"
                size="small"
                title={copied ? "Copied!" : "Copy token"}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
