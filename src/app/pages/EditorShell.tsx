import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { getTestPlanEditorModel, importRemoteTestPlan, uploadTapPlan } from "../api/testplans";
import { getResources, getResourceSchema } from "../api/resources";
import { Toggle } from "../components/editor/atoms";
import { ConsolePanel } from "../components/editor/ConsolePanel";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import {
  DutsPanel,
  InstrumentsPanel,
  ConnectionsPanel,
  ResultListenersPanel,
  TraceListenersPanel,
} from "../components/editor/benchModals";
import { LeftPanel } from "../components/editor/LeftPanel";
import { MenuBar } from "../components/editor/MenuBar";
import { ModalsHost } from "../components/editor/ModalsHost";
import { PropertiesDock } from "../components/editor/PropertiesDock";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import { ResourcesPanel } from "../components/editor/ResourcesPanel";
import { SequenceEditor } from "../components/editor/SequenceEditor";
import { ServerSettingsModal } from "../components/editor/ServerSettingsModal";
import { SystemKpisPanel } from "../components/editor/SystemKpisPanel";
import { Splitter } from "../components/editor/resizable";
import { TestPlansPanel } from "../components/editor/TestPlansPanel";
import { queryClient } from "../api/queryClient";
import {
  getActiveServerProfile,
  hasConfiguredServer,
} from "../config/serverSettings";
import { useTestPlans } from "../hooks/usePlugin";
import type { Property, TestStep } from "../types/editor";
import { flatAll } from "../utils/editor";
import { toast } from "sonner";

interface EditorShellProps {
  selectedId: any;
  leftTab: any;
  setLeftTab: any;
  expanded: any;
  setExpanded: any;
  renaming: any;
  renameRef: any;
  renameVal: any;
  setRenameVal: any;
  commitRename: any;
  setRenaming: any;
  setSelectedId: any;
  setContextMenu: any;
  toggleExpand: any;
  isTablet: any;
  setRightOpen: any;
  dragLibItem: any;
  dropIdx: any;
  setDropIdx: any;
  dragOverSequenceId: string | null;
  setDragOverSequenceId: any;
  handleSeqDrop: any;
  setPlan: any;
  setPlanMeta: any;
  setHasPlan: any;
  selectedStep: any;
  setAddStepParentId: any;
  setAddStepIdx: any;
  setShowAddStep: any;
  updateProperty: any;
  runState: any;
  isSaved: any;
  logs: any;
  consoleFilter: any;
  setConsoleFilter: any;
  library: any;
  libSearch: any;
  setLibSearch: any;
  showSystemKpis: boolean;
  setShowSystemKpis: (value: boolean) => void;
  data: any;
  hasPlan: any;
  setShowNewPlan: any;
  handleAddStep: any;
  plugins: any;
  installedPlugins: any;
  isInstalledPluginsFetching: boolean;
  isAvailablePackagesFetching: boolean;
  handleInstallPlugin: any;
  handleUninstallPlugin: any;
  handleUninstallPackage: any;
  installedSearch: any;
  setInstalledSearch: any;
  browseSearch: any;
  setBrowseSearch: any;
  setShowPluginMgr: any;
  instruments: any[];
  isInstrumentsLoading: boolean;
  isInstrumentsError: boolean;
  duts: any[];
  isDutsLoading: boolean;
  isDutsError: boolean;
  connections: any[];
  isConnectionsLoading: boolean;
  isConnectionsError: boolean;
  resultListeners: any[];
  isResultListenersLoading: boolean;
  isResultListenersError: boolean;
  traceListeners: any[];
  isTraceListenersLoading: boolean;
  isTraceListenersError: boolean;
  plan: any;
  planMeta: any;
  setOutputPath: (path: string | null) => void;
  stats: any;
  activeMenu: any;
  setActiveMenu: any;
  handleSave: any;
  handleExportPlan: any;
  handleImportPlan: any;
  handleRun: any;
  handleStop: any;
  handlePause: any;
  handleReset: any;
  leftOpen: any;
  setLeftOpen: any;
  rightOpen: any;
  isDark: any;
  setIsDark: any;
  handleAddGroup: any;
  leftW: any;
  dragLeft: any;
  rightW: any;
  dragRight: any;
  showConsole: any;
  dragConsole: any;
  consoleH: any;
  setLogs: any;
  setShowConsole: any;
  logEndRef: any;
  showNewPlan: any;
  handleCreatePlan: any;
  showAddStep: any;
  showSaveDestination: boolean;
  defaultOutputPath: string;
  handleConfirmSaveDestination: (path: string) => void;
  handleCancelSaveDestination: () => void;
  addStepParentId: any;
  addStepIdx: any;
  showPluginMgr: any;
  handleUploadPlugin: any;
  contextMenu: any;
  handleContextAction: any;
  setLibFilterOpen: any;
  libFilterOpen: any;
  setDragLibItem: any;
  draggedStepId: string | null;
  setDraggedStepId: (id: string | null) => void;
  handleStepReorder: (
    stepId: string,
    newParentId: string | null,
    newIdx: number,
  ) => void;
}

export function EditorShell(props: EditorShellProps) {
  const STALE_SERVER_HEALTH_MS = 24 * 60 * 60 * 1000;
  const {
    selectedId,
    leftTab,
    setLeftTab,
    expanded,
    setExpanded,
    renaming,
    renameRef,
    renameVal,
    setRenameVal,
    commitRename,
    setRenaming,
    setSelectedId,
    setContextMenu,
    toggleExpand,
    isTablet,
    setRightOpen,
    dragLibItem,
    dropIdx,
    setDropIdx,
    dragOverSequenceId,
    setDragOverSequenceId,
    handleSeqDrop,
    setPlan,
    setPlanMeta,
    setHasPlan,
    selectedStep,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
    updateProperty,
    runState,
    isSaved,
    logs,
    consoleFilter,
    setConsoleFilter,
    library,
    libSearch,
    setLibSearch,
    showSystemKpis,
    setShowSystemKpis,
    data,
    hasPlan,
    setShowNewPlan,
    handleAddStep,
    plugins,
    installedPlugins,
    isInstalledPluginsFetching,
    isAvailablePackagesFetching,
    handleInstallPlugin,
    handleUninstallPlugin,
    handleUninstallPackage,
    installedSearch,
    setInstalledSearch,
    browseSearch,
    setBrowseSearch,
    setShowPluginMgr,
    instruments,
    isInstrumentsLoading,
    isInstrumentsError,
    duts,
    isDutsLoading,
    isDutsError,
    connections,
    isConnectionsLoading,
    isConnectionsError,
    resultListeners,
    isResultListenersLoading,
    isResultListenersError,
    traceListeners,
    isTraceListenersLoading,
    isTraceListenersError,
    plan,
    planMeta,
    setOutputPath,
    stats,
    activeMenu,
    setActiveMenu,
    handleSave,
    handleExportPlan,
    handleImportPlan,
    handleRun,
    handleStop,
    handlePause,
    handleReset,
    leftOpen,
    setLeftOpen,
    rightOpen,
    isDark,
    setIsDark,
    handleAddGroup,
    leftW,
    dragLeft,
    rightW,
    dragRight,
    showConsole,
    dragConsole,
    consoleH,
    setLogs,
    setShowConsole,
    logEndRef,
    showNewPlan,
    handleCreatePlan,
    showAddStep,
    showSaveDestination,
    defaultOutputPath,
    handleConfirmSaveDestination,
    handleCancelSaveDestination,
    addStepParentId,
    addStepIdx,
    showPluginMgr,
    handleUploadPlugin,
    contextMenu,
    handleContextAction,
    setLibFilterOpen,
    libFilterOpen,
    setDragLibItem,
    draggedStepId,
    setDraggedStepId,
    handleStepReorder,
  } = props;
  const [libCat, setLibCat] = useState("All");
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [showInstrumentsPanel, setShowInstrumentsPanel] = useState(false);
  const [dutSearch, setDutSearch] = useState("");
  const [connectionSearch, setConnectionSearch] = useState("");
  const [showDutsPanel, setShowDutsPanel] = useState(false);
  const [showConnectionsPanel, setShowConnectionsPanel] = useState(false);
  const [resultListenerSearch, setResultListenerSearch] = useState("");
  const [traceListenerSearch, setTraceListenerSearch] = useState("");
  const [showResultListenersPanel, setShowResultListenersPanel] = useState(false);
  const [showTraceListenersPanel, setShowTraceListenersPanel] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [showResourcesPanel, setShowResourcesPanel] = useState(false);
  const [showCreateResource, setShowCreateResource] = useState(false);
  const [resourcePlanName, setResourcePlanName] = useState("");
  const [selectedResourceInstrument, setSelectedResourceInstrument] = useState("");
  const [resourceSchema, setResourceSchema] = useState<any>(null);
  const [resourceSchemaValues, setResourceSchemaValues] = useState<Record<string, any>>({});
  const [isResourceSchemaLoading, setIsResourceSchemaLoading] = useState(false);
  const [resourceSchemaError, setResourceSchemaError] = useState("");
  const [resourcePlans, setResourcePlans] = useState<any[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [isResourcesError, setIsResourcesError] = useState(false);
  const [testPlanQuery, setTestPlanQuery] = useState("D:\\");
  const [submittedTestPlanQuery, setSubmittedTestPlanQuery] = useState("");
  const [hasSearchedTestPlans, setHasSearchedTestPlans] = useState(false);
  const [testPlanSearchNonce, setTestPlanSearchNonce] = useState(0);
  const [openingTestPlanPath, setOpeningTestPlanPath] = useState<string | null>(
    null,
  );
  const [openTestPlanError, setOpenTestPlanError] = useState("");
  const [savedPlanSignature, setSavedPlanSignature] = useState("");
  const [pendingTestPlan, setPendingTestPlan] = useState<any | null>(null);
  const [showUnsavedPlanWarning, setShowUnsavedPlanWarning] = useState(false);
  const [showTestPlansPanel, setShowTestPlansPanel] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [isInitialServerSetup, setIsInitialServerSetup] = useState(false);
  const [activeServerLabel, setActiveServerLabel] = useState("");
  const [activeServerHealth, setActiveServerHealth] = useState<"healthy" | "error" | "stale" | "untested">("untested");
  const displayLibrary = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    if (Array.isArray(library)) return library;
    return [];
  }, [data, library]);

  const resolveActiveServerMeta = () => {
    const active = getActiveServerProfile();
    const label = active?.name?.trim() || active?.baseUrl || "Not configured";
    setActiveServerLabel(label);

    if (!active?.lastTestedAt || !active?.lastTestStatus) {
      setActiveServerHealth("untested");
      return;
    }

    const testedAt = new Date(active.lastTestedAt).getTime();
    if (!Number.isFinite(testedAt)) {
      setActiveServerHealth("untested");
      return;
    }

    if (Date.now() - testedAt > STALE_SERVER_HEALTH_MS) {
      setActiveServerHealth("stale");
      return;
    }

    setActiveServerHealth(active.lastTestStatus === "success" ? "healthy" : "error");
  };

  const refreshForServerChange = () => {
    toast.success("Server settings saved. Refreshing application...");
    void queryClient.invalidateQueries().finally(() => {
      window.location.reload();
    });
  };

  useEffect(() => {
    resolveActiveServerMeta();

    if (!hasConfiguredServer()) {
      setIsInitialServerSetup(true);
      setShowServerSettings(true);
    }

    const interval = window.setInterval(() => {
      resolveActiveServerMeta();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const libraryVisualTypeLookup = useMemo(() => {
    const map = new Map<string, string>();
    (displayLibrary || []).forEach((item: any) => {
      const visualType = String(item?.type ?? "").toLowerCase().trim();
      if (!visualType) return;
      [item?.name, item?.stepTypeName, item?.typeName, item?.fullName, item?.className]
        .map((value) => String(value ?? "").toLowerCase().trim())
        .filter(Boolean)
        .forEach((key) => {
          if (!map.has(key)) {
            map.set(key, visualType);
          }
        });
    });
    return map;
  }, [displayLibrary]);

  const libCats = useMemo<string[]>(
    () => [
      "All",
      ...Array.from(
        new Set<string>(
          displayLibrary.map((item: any) => String(item.category)),
        ),
      ),
    ],
    [displayLibrary],
  );

  const filteredLib = useMemo(
    () =>
      displayLibrary.filter(
        (item: any) =>
          (libCat === "All" || item.category === libCat) &&
          (libSearch === "" ||
            item.name.toLowerCase().includes(libSearch.toLowerCase())),
      ),
    [displayLibrary, libCat, libSearch],
  );

  const filteredInstruments = useMemo(
    () =>
      instruments.filter((instrument: any) => {
        const search = instrumentSearch.trim().toLowerCase();
        if (!search) return true;
        return [instrument.name, instrument.baseType, instrument.assembly].some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(search),
        );
      }),
    [instruments, instrumentSearch],
  );

  const filteredDuts = useMemo(
    () =>
      duts.filter((dut: any) => {
        const search = dutSearch.trim().toLowerCase();
        if (!search) return true;
        return [
          dut.name,
          dut.serialNumber,
          dut.model,
          dut.firmware,
          dut.baseType,
          dut.assembly,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search),
        );
      }),
    [duts, dutSearch],
  );

  const filteredConnections = useMemo(
    () =>
      connections.filter((connection: any) => {
        const search = connectionSearch.trim().toLowerCase();
        if (!search) return true;
        return [connection.name, connection.baseType, connection.assembly].some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(search),
        );
      }),
    [connections, connectionSearch],
  );

  const filteredResultListeners = useMemo(
    () =>
      resultListeners.filter((listener: any) => {
        const search = resultListenerSearch.trim().toLowerCase();
        if (!search) return true;
        return [listener.name, listener.baseType, listener.assembly].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search),
        );
      }),
    [resultListeners, resultListenerSearch],
  );

  const filteredTraceListeners = useMemo(
    () =>
      traceListeners.filter((listener: any) => {
        const search = traceListenerSearch.trim().toLowerCase();
        if (!search) return true;
        return [listener.name, listener.baseType, listener.assembly].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(search),
        );
      }),
    [traceListeners, traceListenerSearch],
  );


  const filteredResourcePlans = useMemo(
    () =>
      resourcePlans.filter((resource) => {
        const search = resourceSearch.trim().toLowerCase();
        if (!search) return true;
        return [resource.name, resource.instrument, resource.status].some((value) =>
          value.toLowerCase().includes(search),
        );
      }),
    [resourcePlans, resourceSearch],
  );

  const browsableResourceInstruments = useMemo(
    () =>
      (instruments ?? [])
        .filter(
          (instrument: any) =>
            instrument?.canCreateInstance !== false &&
            instrument?.isBrowsable !== false,
        )
        .filter((instrument: any) => instrument?.name),
    [instruments],
  );

  const selectedResourceInstrumentRecord = useMemo(
    () =>
      browsableResourceInstruments.find(
        (instrument: any) => instrument.name === selectedResourceInstrument,
      ),
    [browsableResourceInstruments, selectedResourceInstrument],
  );

  const resourceSchemaProperties = useMemo(
    () => (resourceSchema as any)?.properties ?? [],
    [resourceSchema],
  );

  const getResourcePropertyDefaultValue = (property: any) => {
    if (property.value !== undefined) return property.value;
    if (property.defaultValue !== undefined) return property.defaultValue;
    const type = String(property.type ?? "").toLowerCase();
    if (type.includes("boolean")) return false;
    if (type.includes("int") || type.includes("double") || type.includes("float")) return "";
    return "";
  };

  useEffect(() => {
    if (!showCreateResource || selectedResourceInstrument || browsableResourceInstruments.length === 0) return;
    const firstInstrument = browsableResourceInstruments[0];
    setSelectedResourceInstrument(firstInstrument.name);
    // Type will be extracted automatically by useEffect
  }, [browsableResourceInstruments, selectedResourceInstrument, showCreateResource]);

  useEffect(() => {
    if (!showCreateResource || !selectedResourceInstrumentRecord || !selectedResourceInstrument) {
      setResourceSchema(null);
      setResourceSchemaValues({});
      setResourceSchemaError("");
      return;
    }

    // Clear schema when instrument selection changes (before fetching new one)
    setResourceSchema(null);
    setResourceSchemaValues({});
    setResourceSchemaError("");

    let cancelled = false;
    const fetchResourceSchema = async () => {
      setIsResourceSchemaLoading(true);

      // Capture the current instrument name to validate response matches
      const currentInstrumentName = selectedResourceInstrument;


      const pluginTypeName = currentInstrumentName?.trim();

      if (!pluginTypeName) {
        setResourceSchemaError("Invalid instrument selection.");
        setIsResourceSchemaLoading(false);
        return;
      }

      try {
        const schema = await getResourceSchema(pluginTypeName);

        // Check if request was cancelled or if user switched instruments
        if (cancelled) {
          return;
        }

        // CRITICAL: Validate that the response matches the currently selected instrument
        if (currentInstrumentName !== selectedResourceInstrument) {
          return;
        }

        setResourceSchema(schema);
      } catch (error) {
        if (cancelled) return;

        // Only show error if this is still the selected instrument
        if (currentInstrumentName === selectedResourceInstrument) {
          setResourceSchema(null);
          setResourceSchemaError(
            error instanceof Error ? error.message : "Unable to load resource schema."
          );
        }
      } finally {
        if (!cancelled && currentInstrumentName === selectedResourceInstrument) {
          setIsResourceSchemaLoading(false);
        }
      }
    };

    fetchResourceSchema();
    return () => {
      cancelled = true;
    };
  }, [selectedResourceInstrumentRecord, selectedResourceInstrument, showCreateResource]);

  useEffect(() => {
    const nextValues: Record<string, any> = {};
    resourceSchemaProperties.forEach((property: any) => {
      const key = String(property.name ?? property.displayName ?? "");
      nextValues[key] = getResourcePropertyDefaultValue(property);
    });
    setResourceSchemaValues(nextValues);
  }, [resourceSchemaProperties]);


  const fetchResourcePlans = useCallback(async () => {
    setIsResourcesLoading(true);
    setIsResourcesError(false);
    try {
      const data = await getResources();
      setResourcePlans(data);
    } catch {
      setIsResourcesError(true);
    } finally {
      setIsResourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchResourcePlans();
    return () => {
      cancelled = true;
    };
    // - }, []);
  }, [fetchResourcePlans]);

  const closeCreateResourceModal = () => {
    setShowCreateResource(false);
    setResourcePlanName("");
    setResourceSchema(null);
    setResourceSchemaValues({});
    setResourceSchemaError("");
  };

  const handleSaveResource = () => {
    const instrumentName = selectedResourceInstrument || "Resource";
    setResourcePlans((items) => [
      ...items,
      {
        id: `rp${Date.now()}`,
        name: resourcePlanName.trim() || `${instrumentName} Resource`,
        instrument: instrumentName,
        status: "Active",
      },
    ]);
    closeCreateResourceModal();
  };

  const handleDeleteResource = (resourceId: string) => {
    setResourcePlans((items) => items.filter((item) => item.id !== resourceId));
  };

  const handleEditResource = (resource: any) => {
    setResourcePlanName(resource.name);
    setSelectedResourceInstrument(resource.instrument);
    setShowCreateResource(true);
  };

  const renderResourceSchemaField = (property: any) => {
    if (!property.isEditable) return null;

    const key = String(property.name ?? "");
    const label = String(property.displayName ?? property.name ?? "");
    const type = String(property.type ?? "").toLowerCase();
    const value = resourceSchemaValues[key];
    const options = property.enumValues ?? [];

    const updateValue = (nextValue: any) =>
      setResourceSchemaValues((values) => ({ ...values, [key]: nextValue }));

    const labelNode = (
      <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
        {label}
      </label>
    );

    const inputClass =
      "w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

    // Boolean type
    if (type.includes("boolean")) {
      return (
        <div key={key} className="flex items-center justify-between gap-3">
          <label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
          <Toggle
            value={Boolean(value)}
            onChange={() => updateValue(!Boolean(value))}
          />
        </div>
      );
    }

    // Enum/Select type
    if (options.length > 0) {
      return (
        <div key={key}>
          {labelNode}
          <select
            value={value ?? ""}
            onChange={(event) => updateValue(event.target.value)}
            className={inputClass}
          >
            <option value="">Select one</option>
            {options.map((option: any, index: number) => {
              const optionValue = String(option);
              return (
                <option key={index} value={optionValue}>
                  {optionValue}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    // Integer type
    if (type.includes("int")) {
      return (
        <div key={key}>
          {labelNode}
          <input
            type="number"
            step="1"
            value={value ?? ""}
            onChange={(event) =>
              updateValue(event.target.value === "" ? "" : Number(event.target.value))
            }
            className={inputClass}
          />
        </div>
      );
    }

    // Number/Float type
    if (type.includes("float") || type.includes("double")) {
      return (
        <div key={key}>
          {labelNode}
          <input
            type="number"
            step="any"
            value={value ?? ""}
            onChange={(event) =>
              updateValue(event.target.value === "" ? "" : Number(event.target.value))
            }
            className={inputClass}
          />
        </div>
      );
    }

    // String type (default)
    return (
      <div key={key}>
        {labelNode}
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={`Enter ${label}`}
          className={inputClass}
        />
      </div>
    );
  };

  const {
    data: testPlans = [],
    isFetching: isTestPlansLoading,
    isError: isTestPlansError,
    refetch: searchTestPlans,
  } = useTestPlans(submittedTestPlanQuery || undefined, false);

  useEffect(() => {
    if (!hasSearchedTestPlans) return;
    searchTestPlans();
  }, [hasSearchedTestPlans, searchTestPlans, testPlanSearchNonce]);

  const handleSearchTestPlans = () => {
    setSubmittedTestPlanQuery(testPlanQuery.trim());
    setHasSearchedTestPlans(true);
    setOpenTestPlanError("");
    setTestPlanSearchNonce((value) => value + 1);
  };

  const handleUploadTapPlan = async (file: File, destinationPath?: string) => {
    await uploadTapPlan(file, destinationPath);
    toast.success(`Uploaded ${file.name} to API server`);

    const targetPath = destinationPath?.trim() || testPlanQuery.trim();
    if (targetPath) {
      setTestPlanQuery(targetPath);
      setSubmittedTestPlanQuery(targetPath);
    }
    setHasSearchedTestPlans(true);
    setTestPlanSearchNonce((value) => value + 1);
  };
  
  const handleImportRemoteTapPlan = async (payload: {
    sourceType: "ftp" | "sftp" | "rest";
    sourceUrl: string;
    destinationPath?: string;
    username?: string;
    password?: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
  }) => {
    await importRemoteTestPlan(payload);
    toast.success("Remote test plan import requested");

    const targetPath = payload.destinationPath?.trim() || testPlanQuery.trim();
    if (targetPath) {
      setTestPlanQuery(targetPath);
      setSubmittedTestPlanQuery(targetPath);
    }
    setHasSearchedTestPlans(true);
    setTestPlanSearchNonce((value) => value + 1);
  };

  const getPlanSignature = (steps: any[], meta: any) => {
    const normalizeStep = (step: any): any => ({
      id: step.id,
      name: step.name,
      type: step.type,
      enabled: step.enabled,
      breakpoint: !!step.breakpoint,
      properties: (step.properties || []).map((prop: any) => ({
        key: prop.key,
        label: prop.label,
        type: prop.type,
        value: prop.value,
        unit: prop.unit,
        options: prop.options,
        group: prop.group,
        isEditable: prop.isEditable,
      })),
      children: step.children?.map(normalizeStep),
    });

    return JSON.stringify({
      meta,
      steps: (steps || []).map(normalizeStep),
    });
  };

  const currentPlanSignature = useMemo(
    () => getPlanSignature(plan || [], planMeta),
    [plan, planMeta],
  );
  const hasUnsavedPlanChanges =
    hasPlan &&
    !!savedPlanSignature &&
    currentPlanSignature !== savedPlanSignature;

  useEffect(() => {
    if (hasPlan && !savedPlanSignature) {
      setSavedPlanSignature(currentPlanSignature);
    }
  }, [currentPlanSignature, hasPlan, savedPlanSignature]);

  const handleSaveAndMarkClean = async () => {
    const snapshotSignature = getPlanSignature(plan || [], planMeta);
    const result = await handleSave();
    if (!result) return result;
    setSavedPlanSignature(snapshotSignature);
    setShowUnsavedPlanWarning(false);
    setPendingTestPlan(null);
    return result;
  };

  const toEditorProperty = (property: any): Property => {
    const enumValues = Array.isArray(property.enumValues)
      ? property.enumValues.map(String)
      : [];
    const rawValue = property.value;
    const hasEnum = enumValues.length > 0;
    const isBoolean =
      typeof rawValue === "boolean" ||
      String(property.type ?? "").includes("Boolean");
    const isNumber = typeof rawValue === "number" && !hasEnum;
    const value =
      hasEnum && typeof rawValue === "number"
        ? (enumValues[rawValue] ?? String(rawValue))
        : rawValue == null
          ? ""
          : Array.isArray(rawValue) || typeof rawValue === "object"
            ? JSON.stringify(rawValue)
            : rawValue;

    return {
      key: String(property.name ?? property.displayName ?? ""),
      label: String(property.displayName ?? property.name ?? ""),
      type: hasEnum
        ? "enum"
        : isBoolean
          ? "boolean"
          : isNumber
            ? "number"
            : "string",
      value: value as Property["value"],
      options: hasEnum ? enumValues : undefined,
      isEditable: property.isEditable !== false,
      group: property.isEditable === false ? "Read Only" : "Properties",
    };
  };

  const toEditorStep = (step: any): TestStep => {
    const children = Array.isArray(step.children)
      ? step.children.map(toEditorStep)
      : [];

    const rawType = String(step.type ?? "").trim();
    const rawName = String(step.name ?? "").trim();
    const rawPath = String(step.path ?? "").trim();

    const lookupCandidates = [rawType, rawName, rawPath]
      .map((value) => value.toLowerCase())
      .filter(Boolean);

    const libraryMappedType = lookupCandidates
      .map((candidate) => libraryVisualTypeLookup.get(candidate))
      .find(Boolean);

    const inferVisualType = () => {
      const haystack = `${rawType} ${rawName} ${rawPath}`.toLowerCase();
      if (children.length > 0 || /\bsequence\b/.test(haystack)) return "sequence";
      if (/\b(rf|spectrum|signal|network analyzer|vna)\b/.test(haystack)) return "rf";
      if (/\b(scpi|instrument|scope|supply|generator|dmm)\b/.test(haystack)) return "instrument";
      if (/\b(dut|device under test)\b/.test(haystack)) return "dut";
      if (/\b(if|condition|parallel|dialog|loop|lock|flow|delay|log|package|install|uninstall)\b/.test(haystack)) return "flow";
      if (/\b(measure|measurement|read|verify|assert|result)\b/.test(haystack)) return "measure";
      return "measure";
    };

    const visualType = libraryMappedType ?? inferVisualType();
    const stepTypeName = [
      step.fullName,
      step.typeName,
      step.className,
      step.stepTypeName,
      rawType,
      rawName,
    ]
      .map((value) => String(value ?? "").trim())
      .find(Boolean) || "unknown";

    return {
      id: String(step.stepId ?? step.path ?? crypto.randomUUID()),
      name: String(step.name ?? "Unnamed Step"),
      type: visualType,
      status: "pending",
      enabled: Boolean(step.enabled ?? true),
      description: String(step.path ?? ""),
      properties: Array.isArray(step.properties)
        ? step.properties.map(toEditorProperty)
        : [],
      children: children.length > 0 ? children : undefined,
      stepTypeName,
      typeName: String(step.typeName ?? stepTypeName),
      fullName: String(step.fullName ?? stepTypeName),
      className: String(step.className ?? stepTypeName),
    };
  };

  const handleOpenTestPlan = async (testPlan: any) => {
    const path = String(testPlan.path ?? "");
    if (!path || openingTestPlanPath) return;

    if (hasUnsavedPlanChanges) {
      setPendingTestPlan(testPlan);
      setShowUnsavedPlanWarning(true);
      return;
    }

    setOpeningTestPlanPath(path);
    setOpenTestPlanError("");
    try {
      const editorModel = await getTestPlanEditorModel(path);
      const steps = Array.isArray(editorModel.steps)
        ? editorModel.steps.map(toEditorStep)
        : [];
      const allSteps = flatAll(steps);
      const meta = {
        name: String(
          editorModel.planName ?? testPlan.name ?? "Untitled Test Plan",
        ),
        description: String(editorModel.path ?? path),
        author: "",
        version: "",
        dutName: "",
        dutSerial: "",
        dutModel: "",
        dutFirmware: "",
      };

      setPlanMeta(meta);
      setPlan(steps);
      setOutputPath(path);
      setSavedPlanSignature(getPlanSignature(steps, meta));
      setShowUnsavedPlanWarning(false);
      setHasPlan(true);
      setSelectedId(allSteps[0]?.id ?? null);
      setExpanded(
        new Set(
          allSteps
            .filter((step) => step.children?.length)
            .map((step) => step.id),
        ),
      );
      setLeftTab("plan");
      setPendingTestPlan(null);
      setShowUnsavedPlanWarning(false);
      setShowTestPlansPanel(false);
    } catch (error) {
      setOpenTestPlanError(
        error instanceof Error ? error.message : "Unable to open test plan.",
      );
    } finally {
      setOpeningTestPlanPath(null);
    }
  };

  const filteredLogs = useMemo(
    () =>
      consoleFilter === "ALL"
        ? logs
        : logs.filter((entry: any) => entry.level === consoleFilter),
    [consoleFilter, logs],
  );

  const propertiesPanel = (
    <PropertiesPanel
      selectedStep={selectedStep}
      selectedId={selectedId}
      plan={plan}
      instruments={instruments}
      resources={resourcePlans}
      testSteps={displayLibrary}
      setPlan={setPlan}
      setSelectedId={setSelectedId}
      setAddStepParentId={setAddStepParentId}
      setShowAddStep={setShowAddStep}
      updateProperty={updateProperty}
    />
  );

  const leftPanel = (
    <LeftPanel
      leftTab={leftTab}
      setLeftTab={setLeftTab}
      plan={plan}
      hasPlan={hasPlan}
      expanded={expanded}
      setExpanded={setExpanded}
      handleAddGroup={handleAddGroup}
      setShowNewPlan={setShowNewPlan}
      libSearch={libSearch}
      setLibSearch={setLibSearch}
      libCat={libCat}
      setLibCat={setLibCat}
      libCats={libCats}
      libFilterOpen={libFilterOpen}
      setLibFilterOpen={setLibFilterOpen}
      filteredLib={filteredLib}
      data={displayLibrary}
      instruments={filteredInstruments}
      instrumentSearch={instrumentSearch}
      setInstrumentSearch={setInstrumentSearch}
      isInstrumentsLoading={isInstrumentsLoading}
      isInstrumentsError={isInstrumentsError}
      setDragLibItem={setDragLibItem}
      setDropIdx={setDropIdx}
      handleAddStep={handleAddStep}
      selectedStep={selectedStep}
      selectedId={selectedId}
      plugins={plugins}
      handleInstallPlugin={handleInstallPlugin}
      setShowPluginMgr={setShowPluginMgr}
      renaming={renaming}
      renameRef={renameRef}
      renameVal={renameVal}
      setRenameVal={setRenameVal}
      commitRename={commitRename}
      setRenaming={setRenaming}
      setSelectedId={setSelectedId}
      setContextMenu={setContextMenu}
      toggleExpand={toggleExpand}
    />
  );

  const sequenceStepProps = {
    selectedId,
    expanded,
    renaming,
    renameRef,
    renameVal,
    setRenameVal,
    commitRename,
    setRenaming,
    setSelectedId,
    setContextMenu,
    toggleExpand,
    isTablet,
    setRightOpen,
    dragLibItem,
    dropIdx,
    setDropIdx,
    dragOverSequenceId,
    setDragOverSequenceId,
    draggedStepId,
    setDraggedStepId,
    handleStepReorder,
    handleSeqDrop,
    setPlan,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
  };

  return (
    <div
      className="operator-readable compact-layout h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      onClick={() => {
        setActiveMenu(null);
        setLibFilterOpen(false);
      }}
    >
      <MenuBar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        hasPlan={hasPlan}
        planMeta={planMeta}
        runState={runState}
        isTablet={isTablet}
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        rightOpen={rightOpen}
        setRightOpen={setRightOpen}
        showConsole={showConsole}
        setShowConsole={setShowConsole}
        isDark={isDark}
        setIsDark={setIsDark}
        setShowNewPlan={setShowNewPlan}
        setShowPluginMgr={setShowPluginMgr}
        setShowInstrumentsPanel={setShowInstrumentsPanel}
        setShowDutsPanel={setShowDutsPanel}
        setShowConnectionsPanel={setShowConnectionsPanel}
        setShowResultListenersPanel={setShowResultListenersPanel}
        setShowTraceListenersPanel={setShowTraceListenersPanel}
        activeServerName={activeServerLabel}
        activeServerHealth={activeServerHealth}
        onOpenServerSettings={() => setShowServerSettings(true)}
        handleSave={handleSaveAndMarkClean}
        handleRun={handleRun}
        handleStop={handleStop}
        handlePause={handlePause}
        handleReset={handleReset}
        handleExportPlan={handleExportPlan}
        handleImportPlan={handleImportPlan}
      />

      <EditorToolbar
        isTablet={isTablet}
        hasPlan={hasPlan}
        plan={plan}
        stats={stats}
        runState={runState}
        isSaved={isSaved}
        setShowNewPlan={setShowNewPlan}
        setShowPluginMgr={setShowPluginMgr}
        setShowResourcesPanel={setShowResourcesPanel}
        setShowTestPlansPanel={setShowTestPlansPanel}
        showSystemKpis={showSystemKpis}
        setShowSystemKpis={setShowSystemKpis}
        setAddStepParentId={setAddStepParentId}
        setAddStepIdx={setAddStepIdx}
        setShowAddStep={setShowAddStep}
        handleSave={handleSaveAndMarkClean}
        handleRun={handleRun}
        handlePause={handlePause}
        handleStop={handleStop}
        handleReset={handleReset}
        handleAddGroup={handleAddGroup}
      />

      {showSystemKpis ? (
        <SystemKpisPanel
          isVisible={showSystemKpis}
          onClose={() => setShowSystemKpis(false)}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          {isTablet && leftOpen && (
            <div
              className="absolute inset-0 z-40"
              onClick={() => setLeftOpen(false)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-2xl z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {leftPanel}
              </div>
            </div>
          )}

          {!isTablet && leftOpen && (
            <>
              <div
                className="shrink-0 flex flex-col border-r border-border bg-card overflow-hidden"
                style={{ width: leftW }}
              >
                {leftPanel}
              </div>
              <Splitter
                dir="h"
                onMouseDown={dragLeft}
                actionButton={(
                  <button
                    type="button"
                    onClick={() => setLeftOpen(false)}
                    className="flex h-6 w-6 items-center justify-center border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground"
                    title="Collapse left panel"
                  >
                    <ChevronLeft size={11} />
                  </button>
                )}
              />
            </>
          )}

          {!isTablet && !leftOpen && (
            <div className="shrink-0 w-9 border-r border-border bg-gradient-to-b from-card to-muted/20 flex items-start justify-center pt-2">
              <button
                onClick={() => setLeftOpen(true)}
                title="Open left panel"
                className="group flex h-40 w-7 flex-col items-center justify-start gap-2 border border-border/60 bg-card/70 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/70 hover:text-foreground"
              >
                <PanelLeftOpen size={13} className="shrink-0" />
                <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl] [text-orientation:mixed]">
                  Steps
                </span>
              </button>
            </div>
          )}

          <SequenceEditor
            hasPlan={hasPlan}
            plan={plan}
            planMeta={planMeta}
            stats={stats}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            dragLibItem={dragLibItem}
            dropIdx={dropIdx}
            setDropIdx={setDropIdx}
            handleSeqDrop={handleSeqDrop}
            handleAddGroup={handleAddGroup}
            setShowNewPlan={setShowNewPlan}
            setAddStepParentId={setAddStepParentId}
            setAddStepIdx={setAddStepIdx}
            setShowAddStep={setShowAddStep}
            sequenceStepProps={sequenceStepProps}
            draggedStepId={draggedStepId}
            handleStepReorder={handleStepReorder}
          />

          {rightOpen ? (
            <PropertiesDock
              isTablet={isTablet}
              rightOpen={rightOpen}
              setRightOpen={setRightOpen}
              selectedStep={selectedStep}
              selectedId={selectedId}
              setPlan={setPlan}
              rightW={rightW}
              dragRight={dragRight}
            >
              {propertiesPanel}
            </PropertiesDock>
          ) : (
            !isTablet && (
              <div className="shrink-0 w-9 border-l border-border bg-gradient-to-b from-card to-muted/20 flex items-start justify-center pt-2">
                <button
                  onClick={() => setRightOpen(true)}
                  title="Open properties"
                  className="group flex h-40 w-7 flex-col items-center justify-start gap-2 border border-border/60 bg-card/70 py-2 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/70 hover:text-foreground"
                >
                  <PanelRightOpen size={13} className="shrink-0" />
                  <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl] [text-orientation:mixed]">
                    Properties
                  </span>
                </button>
              </div>
            )
          )}
        </div>
      )}

      {showInstrumentsPanel && (
        <InstrumentsPanel
          instruments={filteredInstruments}
          search={instrumentSearch}
          setSearch={setInstrumentSearch}
          isLoading={isInstrumentsLoading}
          isError={isInstrumentsError}
          onClose={() => setShowInstrumentsPanel(false)}
          onResourcesChanged={fetchResourcePlans}
        />
      )}

      {showDutsPanel && (
        <DutsPanel
          duts={filteredDuts}
          search={dutSearch}
          setSearch={setDutSearch}
          isLoading={isDutsLoading}
          isError={isDutsError}
          onClose={() => setShowDutsPanel(false)}
        />
      )}

      {showConnectionsPanel && (
        <ConnectionsPanel
          connections={filteredConnections}
          search={connectionSearch}
          setSearch={setConnectionSearch}
          isLoading={isConnectionsLoading}
          isError={isConnectionsError}
          onClose={() => setShowConnectionsPanel(false)}
        />
      )}

      {showResultListenersPanel && (
        <ResultListenersPanel
          resultListeners={filteredResultListeners}
          search={resultListenerSearch}
          setSearch={setResultListenerSearch}
          isLoading={isResultListenersLoading}
          isError={isResultListenersError}
          onClose={() => setShowResultListenersPanel(false)}
        />
      )}

      {showTraceListenersPanel && (
        <TraceListenersPanel
          traceListeners={filteredTraceListeners}
          search={traceListenerSearch}
          setSearch={setTraceListenerSearch}
          isLoading={isTraceListenersLoading}
          isError={isTraceListenersError}
          onClose={() => setShowTraceListenersPanel(false)}
        />
      )}

      {showResourcesPanel && (
        <ResourcesPanel
          resources={filteredResourcePlans}
          search={resourceSearch}
          setSearch={setResourceSearch}
          isLoading={isResourcesLoading}
          isError={isResourcesError}
          showCreateResource={showCreateResource}
          setShowCreateResource={setShowCreateResource}
          onClose={() => setShowResourcesPanel(false)}
          onEdit={handleEditResource}
          onDelete={handleDeleteResource}
          onSave={handleSaveResource}
          onCloseCreate={closeCreateResourceModal}
          resourcePlanName={resourcePlanName}
          setResourcePlanName={setResourcePlanName}
          selectedResourceInstrument={selectedResourceInstrument}
          setSelectedResourceInstrument={setSelectedResourceInstrument}
          browsableResourceInstruments={browsableResourceInstruments}
          isResourceSchemaLoading={isResourceSchemaLoading}
          resourceSchemaError={resourceSchemaError}
          resourceSchemaProperties={resourceSchemaProperties}
          renderResourceSchemaField={renderResourceSchemaField}
        />
      )}

      {showTestPlansPanel && (
        <TestPlansPanel
          testPlans={testPlans}
          query={testPlanQuery}
          setQuery={setTestPlanQuery}
          hasSearched={hasSearchedTestPlans}
          isLoading={isTestPlansLoading}
          isError={isTestPlansError}
          openingPath={openingTestPlanPath}
          openError={openTestPlanError}
          showUnsavedWarning={showUnsavedPlanWarning}
          pendingTestPlan={pendingTestPlan}
          onSearch={handleSearchTestPlans}
          onOpen={handleOpenTestPlan}
          onClose={() => setShowTestPlansPanel(false)}
          onCancelUnsavedWarning={() => {
            setShowUnsavedPlanWarning(false);
            setPendingTestPlan(null);
          }}
          onSaveUnsavedChanges={handleSaveAndMarkClean}
          onUploadTapPlan={handleUploadTapPlan}
          onImportRemotePlan={handleImportRemoteTapPlan}
        />
      )}
      {!showSystemKpis && (
        <ConsolePanel
          showConsole={showConsole}
          dragConsole={dragConsole}
          consoleH={consoleH}
          logs={logs}
          filteredLogs={filteredLogs}
          consoleFilter={consoleFilter}
          setConsoleFilter={setConsoleFilter}
          setLogs={setLogs}
          setShowConsole={setShowConsole}
          logEndRef={logEndRef}
        />
      )}

      <ModalsHost
        showNewPlan={showNewPlan}
        setShowNewPlan={setShowNewPlan}
        handleCreatePlan={handleCreatePlan}
        showAddStep={showAddStep}
        setShowAddStep={setShowAddStep}
        showSaveDestination={showSaveDestination}
        defaultOutputPath={defaultOutputPath}
        handleConfirmSaveDestination={handleConfirmSaveDestination}
        handleCancelSaveDestination={handleCancelSaveDestination}
        library={library}
        handleAddStep={handleAddStep}
        addStepParentId={addStepParentId}
        addStepIdx={addStepIdx}
        instruments={instruments}
        duts={duts}
        connections={connections}
        showPluginMgr={showPluginMgr}
        setShowPluginMgr={setShowPluginMgr}
        plugins={plugins}
        installedPlugins={installedPlugins}
        isInstalledLoading={isInstalledPluginsFetching}
        isAvailableLoading={isAvailablePackagesFetching}
        handleInstallPlugin={handleInstallPlugin}
        handleUninstallPlugin={handleUninstallPlugin}
        handleUninstallPackage={handleUninstallPackage}
        handleUploadPlugin={handleUploadPlugin}
        installedSearch={installedSearch}
        setInstalledSearch={setInstalledSearch}
        browseSearch={browseSearch}
        setBrowseSearch={setBrowseSearch}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        handleContextAction={handleContextAction}
      />

      <ServerSettingsModal
        isOpen={showServerSettings}
        forceSetup={isInitialServerSetup}
        onClose={() => setShowServerSettings(false)}
        onSaved={(active) => {
          const label = active?.name?.trim() || active?.baseUrl || "Not configured";
          setActiveServerLabel(label);
          if (!active?.lastTestedAt || !active?.lastTestStatus) {
            setActiveServerHealth("untested");
          } else {
            const testedAt = new Date(active.lastTestedAt).getTime();
            if (!Number.isFinite(testedAt)) {
              setActiveServerHealth("untested");
            } else if (Date.now() - testedAt > STALE_SERVER_HEALTH_MS) {
              setActiveServerHealth("stale");
            } else {
              setActiveServerHealth(active.lastTestStatus === "success" ? "healthy" : "error");
            }
          }
          setIsInitialServerSetup(false);
          refreshForServerChange();
        }}
      />
    </div>
  );
}
