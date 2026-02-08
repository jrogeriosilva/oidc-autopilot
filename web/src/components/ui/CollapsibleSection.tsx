import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg mb-3 bg-bg-secondary">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-text-primary cursor-pointer select-none"
      >
        <ChevronRight
          size={12}
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        />
        {title}
      </button>
      {open && <div className="px-3 pb-2.5">{children}</div>}
    </div>
  );
}
