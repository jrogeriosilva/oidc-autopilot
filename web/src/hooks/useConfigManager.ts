import { useReducer, useCallback } from "react";
import type { PlanConfig, ActionConfig, ModuleConfig } from "../types/api";

interface ConfigManagerState {
  filename: string;
  dirty: boolean;
  config: PlanConfig;
  availableModules: string[];
  selectedModuleName: string | null;
  editingActionIndex: number;
  statusMessage: string;
  statusError: boolean;
}

type Action =
  | { type: "NEW_CONFIG" }
  | { type: "LOAD_CONFIG"; filename: string; config: PlanConfig }
  | { type: "SET_FILENAME"; filename: string }
  | { type: "MARK_SAVED"; filename: string }
  | { type: "SET_STATUS"; message: string; isError: boolean }
  | { type: "SET_AVAILABLE_MODULES"; modules: string[] }
  | { type: "SET_SELECTED_MODULE"; name: string | null }
  | { type: "SET_EDITING_ACTION"; index: number }
  | { type: "SET_VARIABLES"; variables: Record<string, string> }
  | { type: "SET_CAPTURE_VARS"; vars: string[] }
  | { type: "SET_ACTIONS"; actions: ActionConfig[] }
  | { type: "SET_MODULES"; modules: ModuleConfig[] }
  | { type: "UPDATE_ACTION"; index: number; action: ActionConfig }
  | { type: "UPDATE_MODULE"; name: string; module: ModuleConfig };

const emptyConfig: PlanConfig = {
  capture_vars: [],
  variables: {},
  actions: [],
  modules: [],
};

const initialState: ConfigManagerState = {
  filename: "",
  dirty: false,
  config: { ...emptyConfig },
  availableModules: [],
  selectedModuleName: null,
  editingActionIndex: -1,
  statusMessage: "Ready",
  statusError: false,
};

function reducer(
  state: ConfigManagerState,
  action: Action,
): ConfigManagerState {
  switch (action.type) {
    case "NEW_CONFIG":
      return {
        ...initialState,
        statusMessage: "New config — enter a filename and start editing",
      };

    case "LOAD_CONFIG":
      return {
        ...state,
        filename: action.filename,
        dirty: false,
        config: action.config,
        editingActionIndex: -1,
        selectedModuleName: null,
        statusMessage: `Loaded: ${action.filename}`,
        statusError: false,
      };

    case "SET_FILENAME":
      return { ...state, filename: action.filename };

    case "MARK_SAVED":
      return {
        ...state,
        filename: action.filename,
        dirty: false,
        statusMessage: `Saved: ${action.filename}`,
        statusError: false,
      };

    case "SET_STATUS":
      return {
        ...state,
        statusMessage: action.message,
        statusError: action.isError,
      };

    case "SET_AVAILABLE_MODULES":
      return { ...state, availableModules: action.modules };

    case "SET_SELECTED_MODULE":
      return { ...state, selectedModuleName: action.name };

    case "SET_EDITING_ACTION":
      return { ...state, editingActionIndex: action.index };

    case "SET_VARIABLES":
      return {
        ...state,
        dirty: true,
        config: { ...state.config, variables: action.variables },
      };

    case "SET_CAPTURE_VARS":
      return {
        ...state,
        dirty: true,
        config: { ...state.config, capture_vars: action.vars },
      };

    case "SET_ACTIONS":
      return {
        ...state,
        dirty: true,
        config: { ...state.config, actions: action.actions },
      };

    case "SET_MODULES":
      return {
        ...state,
        dirty: true,
        config: { ...state.config, modules: action.modules },
      };

    case "UPDATE_ACTION": {
      const actions = [...state.config.actions];
      actions[action.index] = action.action;
      return {
        ...state,
        dirty: true,
        config: { ...state.config, actions },
      };
    }

    case "UPDATE_MODULE": {
      const modules = state.config.modules.map((m) =>
        m.name === action.name ? action.module : m,
      );
      return {
        ...state,
        dirty: true,
        config: { ...state.config, modules },
      };
    }

    default:
      return state;
  }
}

export function useConfigManager() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const newConfig = useCallback(() => dispatch({ type: "NEW_CONFIG" }), []);
  const loadConfig = useCallback(
    (filename: string, config: PlanConfig) =>
      dispatch({ type: "LOAD_CONFIG", filename, config }),
    [],
  );
  const setFilename = useCallback(
    (filename: string) => dispatch({ type: "SET_FILENAME", filename }),
    [],
  );
  const markSaved = useCallback(
    (filename: string) => dispatch({ type: "MARK_SAVED", filename }),
    [],
  );
  const setStatus = useCallback(
    (message: string, isError: boolean) =>
      dispatch({ type: "SET_STATUS", message, isError }),
    [],
  );
  const setAvailableModules = useCallback(
    (modules: string[]) => dispatch({ type: "SET_AVAILABLE_MODULES", modules }),
    [],
  );
  const setSelectedModule = useCallback(
    (name: string | null) => dispatch({ type: "SET_SELECTED_MODULE", name }),
    [],
  );
  const setEditingAction = useCallback(
    (index: number) => dispatch({ type: "SET_EDITING_ACTION", index }),
    [],
  );
  const setVariables = useCallback(
    (variables: Record<string, string>) =>
      dispatch({ type: "SET_VARIABLES", variables }),
    [],
  );
  const setCaptureVars = useCallback(
    (vars: string[]) => dispatch({ type: "SET_CAPTURE_VARS", vars }),
    [],
  );
  const setActions = useCallback(
    (actions: ActionConfig[]) => dispatch({ type: "SET_ACTIONS", actions }),
    [],
  );
  const setModules = useCallback(
    (modules: ModuleConfig[]) => dispatch({ type: "SET_MODULES", modules }),
    [],
  );
  const updateAction = useCallback(
    (index: number, action: ActionConfig) =>
      dispatch({ type: "UPDATE_ACTION", index, action }),
    [],
  );
  const updateModule = useCallback(
    (name: string, module: ModuleConfig) =>
      dispatch({ type: "UPDATE_MODULE", name, module }),
    [],
  );

  return {
    state,
    newConfig,
    loadConfig,
    setFilename,
    markSaved,
    setStatus,
    setAvailableModules,
    setSelectedModule,
    setEditingAction,
    setVariables,
    setCaptureVars,
    setActions,
    setModules,
    updateAction,
    updateModule,
  };
}
