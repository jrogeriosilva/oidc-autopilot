import { useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";

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
    <label className="flex-1 min-w-[180px] text-xs text-text-secondary">
      <span className="block mb-0.5">Bearer Token</span>
      <div className="flex gap-1 items-center">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="your-api-token"
          required
          className="flex-1 px-2 py-1.5 bg-bg-input border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          title={show ? "Hide token" : "Show token"}
          className="p-1.5 border border-border rounded text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy token"}
          className="p-1.5 border border-border rounded text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
        >
          <Copy size={14} />
        </button>
      </div>
    </label>
  );
}
