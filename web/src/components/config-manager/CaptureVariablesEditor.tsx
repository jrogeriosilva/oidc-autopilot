interface Props {
  vars: string[];
  onChange: (vars: string[]) => void;
}

export default function CaptureVariablesEditor({ vars, onChange }: Props) {
  const handleChange = (index: number, value: string) => {
    const updated = [...vars];
    updated[index] = value.trim();
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(vars.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...vars, ""]);
  };

  return (
    <>
      {vars.map((v, i) => (
        <div key={i} className="flex gap-1.5 mb-1 items-center">
          <input
            type="text"
            value={v}
            placeholder="variable name"
            onChange={(e) => handleChange(i, e.target.value)}
            className="flex-1 px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.8rem] focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => handleDelete(i)}
            className="bg-transparent border border-border rounded text-red cursor-pointer text-xs px-2 py-0.5 leading-none hover:text-[#ff7b72] hover:border-red"
          >
            x
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full mt-1 py-1 bg-transparent border border-dashed border-border rounded text-text-secondary text-[0.78rem] text-center cursor-pointer hover:border-accent hover:text-accent"
      >
        + Add Capture Variable
      </button>
    </>
  );
}
