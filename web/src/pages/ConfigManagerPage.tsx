import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DataObjectIcon from "@mui/icons-material/DataObject";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import BoltIcon from "@mui/icons-material/Bolt";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { useConfigManager } from "../hooks/useConfigManager";
import { fetchConfigFile, saveConfigFile, deleteConfigFile, fetchPlanInfo } from "../api/configApi";
import ConfigToolbar, { validateFilename } from "../components/config-manager/ConfigToolbar";
import GlobalVariablesEditor from "../components/config-manager/GlobalVariablesEditor";
import CaptureVariablesEditor from "../components/config-manager/CaptureVariablesEditor";
import ActionsEditor from "../components/config-manager/ActionsEditor";
import AvailableModulesPanel from "../components/config-manager/AvailableModulesPanel";
import SelectedModulesPanel from "../components/config-manager/SelectedModulesPanel";
import JsonPreview from "../components/config-manager/JsonPreview";
import StatusBar from "../components/config-manager/StatusBar";

function SectionHeader({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string | number;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
      <Box sx={{ color: "text.secondary", display: "inline-flex" }}>{icon}</Box>
      <Typography
        variant="subtitle2"
        sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        {title}
      </Typography>
      {hint !== undefined && (
        <Typography variant="caption" sx={{ color: "text.disabled", ml: "auto" }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default function ConfigManagerPage() {
  const cm = useConfigManager();
  const { state } = cm;

  const handleLoad = async (filename: string) => {
    if (!filename) {
      cm.setStatus("Select a config file first", true);
      return;
    }
    try {
      const cfg = await fetchConfigFile(filename);
      cm.loadConfig(filename, {
        capture_vars: cfg.capture_vars || [],
        variables: cfg.variables || {},
        actions: cfg.actions || [],
        modules: cfg.modules || [],
      });
    } catch (err) {
      cm.setStatus(`Load failed: ${err instanceof Error ? err.message : String(err)}`, true);
    }
  };

  const handleSave = async () => {
    const fname = state.filename.trim();
    const v = validateFilename(fname);
    if (!v.ok) {
      cm.setStatus(v.msg || "Invalid filename", true);
      return;
    }

    const errors: string[] = [];
    const actionNames: Record<string, boolean> = {};
    for (let i = 0; i < state.config.actions.length; i++) {
      const a = state.config.actions[i];
      if (!a.name?.trim()) errors.push(`Action #${i + 1} has no name`);
      if (a.name && actionNames[a.name]) errors.push(`Duplicate action name: ${a.name}`);
      actionNames[a.name] = true;
      if (a.type === "api" && !a.endpoint?.trim()) errors.push(`API action "${a.name}" needs an endpoint`);
      if (a.type === "browser" && !a.url?.trim()) errors.push(`Browser action "${a.name}" needs a URL`);
    }
    if (errors.length > 0) {
      cm.setStatus(`Validation: ${errors.join("; ")}`, true);
      return;
    }

    try {
      await saveConfigFile(fname, state.config);
      cm.markSaved(fname);
    } catch (err) {
      cm.setStatus(`Save failed: ${err instanceof Error ? err.message : String(err)}`, true);
    }
  };

  const handleDelete = async (filename: string) => {
    const fname = filename || state.filename.trim();
    if (!fname) {
      cm.setStatus("No config selected to delete", true);
      return;
    }
    if (!confirm(`Delete ${fname}?`)) return;
    try {
      await deleteConfigFile(fname);
      cm.newConfig();
      cm.setStatus(`Deleted: ${fname}`, false);
    } catch (err) {
      cm.setStatus(`Delete failed: ${err instanceof Error ? err.message : String(err)}`, true);
    }
  };

  const handleFetchModules = async (planName: string) => {
    if (!planName) {
      cm.setStatus("Enter a plan name first", true);
      return;
    }
    cm.setStatus(`Fetching modules for ${planName}...`, false);
    try {
      const info = await fetchPlanInfo(planName);
      const modules = (info.modules || []).map((m) => m.testModule);
      cm.setAvailableModules(modules);
      cm.setStatus(`Fetched ${modules.length} modules from ${planName}`, false);
    } catch (err) {
      cm.setStatus(`Fetch failed: ${err instanceof Error ? err.message : String(err)}`, true);
    }
  };

  const handleToggleModule = (name: string, checked: boolean) => {
    if (checked) {
      cm.setModules([...state.config.modules, { name }]);
    } else {
      cm.setModules(state.config.modules.filter((m) => m.name !== name));
    }
  };

  const handleSelectAll = () => {
    const existing = state.config.modules.map((m) => m.name);
    const allNames = [...new Set([...state.availableModules, ...existing])];
    const newModules = [...state.config.modules];
    for (const name of allNames) {
      if (!existing.includes(name)) newModules.push({ name });
    }
    cm.setModules(newModules);
  };

  const handleDeselectAll = () => {
    cm.setModules([]);
    cm.setExpandedModule(null);
  };

  const handleModuleReorder = (from: number, to: number) => {
    const modules = [...state.config.modules];
    const [moved] = modules.splice(from, 1);
    modules.splice(to, 0, moved);
    cm.setModules(modules);
  };

  const handleRemoveModule = (index: number) => {
    const modules = state.config.modules.filter((_, i) => i !== index);
    cm.setModules(modules);
    if (state.expandedModuleIndex === index) cm.setExpandedModule(null);
  };

  const handleChangeModuleActions = (index: number, actions: string[]) => {
    const modules = [...state.config.modules];
    modules[index] = { ...modules[index], actions };
    cm.setModules(modules);
  };

  return (
    <>
      <ConfigToolbar
        filename={state.filename}
        dirty={state.dirty}
        lastSavedAt={state.lastSavedAt}
        onNew={cm.newConfig}
        onLoad={handleLoad}
        onSave={handleSave}
        onDelete={handleDelete}
        onFilenameChange={cm.setFilename}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(280px, 28%) minmax(360px, 1fr)",
            lg: "minmax(280px, 28%) minmax(360px, 1fr) minmax(360px, 32%)",
          },
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left: Editors */}
        <Box
          sx={{
            overflowY: "auto",
            p: 2,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box component="section">
            <SectionHeader
              icon={<DataObjectIcon fontSize="small" />}
              title="Global Variables"
              hint={Object.keys(state.config.variables || {}).length}
            />
            <GlobalVariablesEditor
              variables={state.config.variables}
              onChange={cm.setVariables}
            />
          </Box>
          <Box component="section">
            <SectionHeader
              icon={<DownloadForOfflineIcon fontSize="small" />}
              title="Capture Variables"
              hint={(state.config.capture_vars || []).length}
            />
            <CaptureVariablesEditor
              vars={state.config.capture_vars}
              onChange={cm.setCaptureVars}
            />
          </Box>
          <Box component="section">
            <SectionHeader
              icon={<BoltIcon fontSize="small" />}
              title="Actions"
              hint={(state.config.actions || []).length}
            />
            <ActionsEditor
              actions={state.config.actions}
              modules={state.config.modules}
              editingIndex={state.editingActionIndex}
              onSetActions={cm.setActions}
              onSetEditing={cm.setEditingAction}
              onUpdateAction={cm.updateAction}
            />
          </Box>
        </Box>

        {/* Middle: Modules */}
        <Box
          sx={{
            overflowY: "auto",
            p: 2,
            borderRight: { lg: 1 },
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Box component="section">
            <SectionHeader
              icon={<LibraryBooksIcon fontSize="small" />}
              title="Available Modules"
              hint={state.availableModules.length}
            />
            <AvailableModulesPanel
              availableModules={state.availableModules}
              configModules={state.config.modules}
              onToggle={handleToggleModule}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onFetch={handleFetchModules}
            />
          </Box>
          <Box component="section">
            <SectionHeader
              icon={<ChecklistIcon fontSize="small" />}
              title="Selected Modules"
              hint={`${state.config.modules.length}${state.expandedModuleIndex != null ? " · 1 expanded" : ""}`}
            />
            <SelectedModulesPanel
              modules={state.config.modules}
              allActions={state.config.actions}
              expandedIndex={state.expandedModuleIndex}
              onSetExpandedIndex={cm.setExpandedModule}
              onReorder={handleModuleReorder}
              onRemove={handleRemoveModule}
              onChangeActions={handleChangeModuleActions}
            />
            {state.config.modules.length > 0 && (
              <Typography
                variant="caption"
                sx={{ color: "text.disabled", display: "block", mt: 0.75 }}
              >
                Click a row to attach actions. Drag the handle to reorder.
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right: JSON preview */}
        <Box
          sx={{
            overflow: "hidden",
            p: 2,
            display: { xs: "none", lg: "flex" },
            flexDirection: "column",
            minHeight: 0,
            bgcolor: "rgba(0,0,0,0.15)",
          }}
        >
          <JsonPreview config={state.config} filename={state.filename} />
        </Box>
      </Box>

      <StatusBar message={state.statusMessage} isError={state.statusError} />
    </>
  );
}
