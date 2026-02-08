import { useConfigManager } from "../hooks/useConfigManager";
import { fetchConfigFile, saveConfigFile, deleteConfigFile, fetchPlanInfo } from "../api/configApi";
import { fetchConfigs } from "../api/client";
import ConfigToolbar from "../components/config-manager/ConfigToolbar";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import GlobalVariablesEditor from "../components/config-manager/GlobalVariablesEditor";
import CaptureVariablesEditor from "../components/config-manager/CaptureVariablesEditor";
import ActionsEditor from "../components/config-manager/ActionsEditor";
import AvailableModulesPanel from "../components/config-manager/AvailableModulesPanel";
import SelectedModulesPanel from "../components/config-manager/SelectedModulesPanel";
import ModuleConfigPanel from "../components/config-manager/ModuleConfigPanel";
import StatusBar from "../components/config-manager/StatusBar";
import type { ModuleConfig } from "../types/api";

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
    if (!fname) {
      cm.setStatus("Enter a filename", true);
      return;
    }
    if (!fname.endsWith(".config.json")) {
      cm.setStatus("Filename must end with .config.json", true);
      return;
    }

    // Client-side validation
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
      if (state.selectedModuleName === name) cm.setSelectedModule(null);
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
    cm.setSelectedModule(null);
  };

  const handleModuleReorder = (from: number, to: number) => {
    const modules = [...state.config.modules];
    const [moved] = modules.splice(from, 1);
    modules.splice(to, 0, moved);
    cm.setModules(modules);
  };

  const handleRemoveModule = (index: number) => {
    const name = state.config.modules[index]?.name;
    const modules = state.config.modules.filter((_, i) => i !== index);
    cm.setModules(modules);
    if (state.selectedModuleName === name) cm.setSelectedModule(null);
  };

  const selectedModule = state.config.modules.find(
    (m) => m.name === state.selectedModuleName,
  );

  return (
    <>
      <ConfigToolbar
        filename={state.filename}
        dirty={state.dirty}
        onNew={cm.newConfig}
        onLoad={handleLoad}
        onSave={handleSave}
        onDelete={handleDelete}
        onFilenameChange={cm.setFilename}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[42%] overflow-y-auto p-4 border-r border-border">
          <CollapsibleSection title="Global Variables">
            <GlobalVariablesEditor
              variables={state.config.variables}
              onChange={cm.setVariables}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Capture Variables">
            <CaptureVariablesEditor
              vars={state.config.capture_vars}
              onChange={cm.setCaptureVars}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Actions">
            <ActionsEditor
              actions={state.config.actions}
              editingIndex={state.editingActionIndex}
              onSetActions={cm.setActions}
              onSetEditing={cm.setEditingAction}
              onUpdateAction={cm.updateAction}
            />
          </CollapsibleSection>
        </div>

        {/* Right panel */}
        <div className="w-[58%] overflow-y-auto p-4">
          <CollapsibleSection title="Available Modules">
            <AvailableModulesPanel
              availableModules={state.availableModules}
              configModules={state.config.modules}
              onToggle={handleToggleModule}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onFetch={handleFetchModules}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Selected Modules">
            <SelectedModulesPanel
              modules={state.config.modules}
              selectedName={state.selectedModuleName}
              onReorder={handleModuleReorder}
              onSelect={cm.setSelectedModule}
              onRemove={handleRemoveModule}
            />
          </CollapsibleSection>

          {selectedModule && (
            <CollapsibleSection title="Module Config">
              <ModuleConfigPanel
                module={selectedModule}
                allActions={state.config.actions}
                onChange={(mod) => cm.updateModule(mod.name, mod)}
              />
            </CollapsibleSection>
          )}
        </div>
      </div>

      <StatusBar
        message={state.statusMessage}
        isError={state.statusError}
      />
    </>
  );
}
