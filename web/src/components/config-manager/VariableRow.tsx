interface Props {
  keyName: string;
  value: string;
  onKeyChange: (newKey: string) => void;
  onValueChange: (newValue: string) => void;
  onDelete: () => void;
}

export default function VariableRow({
  keyName,
  value,
  onKeyChange,
  onValueChange,
  onDelete,
}: Props) {
  return (
    <div className="flex gap-1.5 mb-1 items-center">
      <input
        type="text"
        value={keyName}
        placeholder="key"
        onChange={(e) => onKeyChange(e.target.value)}
        className="flex-1 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={value}
        placeholder="value"
        onChange={(e) => onValueChange(e.target.value)}
        className="flex-1 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] focus:outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={onDelete}
        className="bg-transparent border border-border rounded text-red cursor-pointer text-xs px-2 py-0.5 leading-none hover:text-[#ff7b72] hover:border-red"
      >
        x
      </button>
    </div>
  );
}
