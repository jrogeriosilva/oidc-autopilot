import { useState, useEffect } from "react";
import { fetchConfigs } from "../../api/client";

interface Props {
  filename: string;
  dirty: boolean;
  onNew: () => void;
  onLoad: (filename: string) => void;
  onSave: () => void;
  onDelete: (filename: string) => void;
  onFilenameChange: (filename: string) => void;
}

export default function ConfigToolbar({
  filename,
  dirty,
  onNew,
  onLoad,
  onSave,
  onDelete,
  onFilenameChange,
}: Props) {
  const [configFiles, setConfigFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");

  const refreshConfigs = () => {
    fetchConfigs()
      .then((d) => setConfigFiles(d.files))
      .catch(() => {});
  };

  useEffect(() => {
    refreshConfigs();
  }, []);

  // Refresh config list after save/delete
  useEffect(() => {
    refreshConfigs();
  }, [dirty]);

  return (
    <div className="flex items-center gap-2 px-6 py-2 bg-bg-secondary border-b border-border flex-wrap">
      <button
        type="button"
        onClick={onNew}
        className="px-3.5 py-1 bg-[#21262d] border border-border rounded-md text-text-primary font-semibold text-[0.82rem] cursor-pointer hover:bg-border whitespace-nowrap"
      >
        New
      </button>
      <select
        value={selectedFile}
        onChange={(e) => setSelectedFile(e.target.value)}
        className="px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.82rem] min-w-[180px] appearance-auto focus:outline-none focus:border-accent"
      >
        <option value="">— select config —</option>
        {configFiles.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onLoad(selectedFile)}
        className="px-3.5 py-1 bg-[#21262d] border border-border rounded-md text-text-primary font-semibold text-[0.82rem] cursor-pointer hover:bg-border whitespace-nowrap"
      >
        Load
      </button>
      <button
        type="button"
        onClick={onSave}
        className="px-3.5 py-1 bg-green-solid border-green-solid rounded-md text-white font-semibold text-[0.82rem] cursor-pointer hover:bg-green-hover whitespace-nowrap"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onDelete(selectedFile || filename)}
        className="px-3.5 py-1 bg-red-solid border-red-solid rounded-md text-white font-semibold text-[0.82rem] cursor-pointer hover:bg-red whitespace-nowrap"
      >
        Delete
      </button>
      <input
        type="text"
        value={filename}
        onChange={(e) => onFilenameChange(e.target.value)}
        placeholder="filename.config.json"
        className="px-2 py-1 bg-bg-input border border-border rounded text-text-primary text-[0.82rem] min-w-[200px] focus:outline-none focus:border-accent"
      />
      {dirty && (
        <span className="text-[0.72rem] text-yellow font-semibold px-2 py-0.5 bg-yellow-bg rounded-xl">
          unsaved
        </span>
      )}
    </div>
  );
}
