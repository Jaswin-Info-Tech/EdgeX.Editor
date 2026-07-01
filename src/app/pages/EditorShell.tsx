import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Database, Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { getTestPlanEditorModel } from "../api/testplans";
import { getStepSchema } from "../api/plugin";
import { ConsolePanel } from "../components/editor/ConsolePanel";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { MenuBar } from "../components/editor/MenuBar";
import { ModalsHost } from "../components/editor/ModalsHost";
import { PropertiesDock } from "../components/editor/PropertiesDock";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import { SequenceEditor } from "../components/editor/SequenceEditor";
import { Splitter } from "../components/editor/resizable";
import { useTestPlans } from "../hooks/usePlugin";
import type { Property, TestStep } from "../types/editor";
import { flatAll } from "../utils/editor";

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
  plan: any;
  planMeta: any;
  stats: any;
  activeMenu: any;
  setActiveMenu: any;
  handleSave: any;
  handleExportPlan: any; 
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
    plan,
    planMeta,
    stats,
    activeMenu,
    setActiveMenu,
    handleSave,
    handleExportPlan,
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
  const [showDutsPanel, setShowDutsPanel] = useState(false);
  const [resourceSearch, setResourceSearch] = useState("");
  const [showResourcesPanel, setShowResourcesPanel] = useState(false);
  const [showCreateResource, setShowCreateResource] = useState(false);
  const [resourcePlanName, setResourcePlanName] = useState("");
  const [selectedResourceInstrument, setSelectedResourceInstrument] = useState("");
  const [resourceSchema, setResourceSchema] = useState<any>(null);
  const [resourceSchemaValues, setResourceSchemaValues] = useState<Record<string, any>>({});
  const [isResourceSchemaLoading, setIsResourceSchemaLoading] = useState(false);
  const [resourceSchemaError, setResourceSchemaError] = useState("");
  const [resourcePlans, setResourcePlans] = useState([
    { id: "rp1", name: "Resource Plan 1", instrument: "Oscilloscope", status: "Active" },
    { id: "rp2", name: "Resource Plan 2", instrument: "Multimeter", status: "Active" },
    { id: "rp3", name: "Resource Plan 3", instrument: "Oscilloscope", status: "Active" },
    { id: "rp4", name: "Resource Plan 4", instrument: "Multimeter", status: "Active" },
    { id: "rp5", name: "Resource Plan 5", instrument: "Oscilloscope", status: "Active" },
  ]);
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
  const displayLibrary = data?.length ? data : library;

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

  const fallbackResourceSchema = useMemo(
    () => ({
      name: selectedResourceInstrument || "Generic SCPI Instrument",
      properties: [
        { name: "Address", editorType: "text", value: "" },
        { name: "I/O Timeout", editorType: "integer", value: 2000 },
        { name: "Lock Hold Off", editorType: "number", value: 0.1 },
        { name: "Lock Queries", editorType: "checkbox", value: false },
        { name: "Name", editorType: "text", value: "SCPI" },
        { name: "Error Checking", editorType: "checkbox", value: false },
        { name: "IsConnected", editorType: "checkbox", value: false },
        { name: "Lock Instrument", editorType: "checkbox", value: false },
        { name: "Lock Retries", editorType: "integer", value: 5 },
        { name: "Send *CLS on Connect", editorType: "checkbox", value: true },
        { name: "Send *IDN? on Connect", editorType: "checkbox", value: true },
        { name: "Send VIClear on Connect", editorType: "checkbox", value: true },
        { name: "Verbose SCPI Logging", editorType: "checkbox", value: true },
      ],
    }),
    [selectedResourceInstrument],
  );

  const getResourceSchemaRecords = (response: any) => {
    if (Array.isArray(response?.schemas)) return response.schemas;
    if (Array.isArray(response)) return response;
    if (response?.properties) return [response];
    return [];
  };

  const resourceSchemaRecord = useMemo(
    () => getResourceSchemaRecords(resourceSchema)[0] ?? null,
    [resourceSchema],
  );

  const resourceSchemaProperties = useMemo(
    () => resourceSchemaRecord?.properties ?? [],
    [resourceSchemaRecord],
  );

  const getResourcePropertyDefaultValue = (property: any) => {
    if (property.value !== undefined) return property.value;
    if (property.defaultValue !== undefined) return property.defaultValue;
    const editorType = String(property.editorType ?? "").toLowerCase();
    if (editorType === "checkbox" || editorType === "boolean") return false;
    if (editorType === "integer" || editorType === "number") return "";
    return "";
  };

  useEffect(() => {
    if (!showCreateResource || selectedResourceInstrument || browsableResourceInstruments.length === 0) return;
    setSelectedResourceInstrument(browsableResourceInstruments[0].name);
  }, [browsableResourceInstruments, selectedResourceInstrument, showCreateResource]);

  useEffect(() => {
    if (!showCreateResource || !selectedResourceInstrumentRecord) {
      setResourceSchema(null);
      setResourceSchemaValues({});
      setResourceSchemaError("");
      return;
    }

    let cancelled = false;
    const fetchResourceSchema = async () => {
      setIsResourceSchemaLoading(true);
      setResourceSchemaError("");
      const schemaTypeName =
        selectedResourceInstrumentRecord.fullName ??
        selectedResourceInstrumentRecord.typeName ??
        selectedResourceInstrumentRecord.baseType ??
        selectedResourceInstrumentRecord.name;

      try {
        const schema = await getStepSchema(schemaTypeName);
        if (cancelled) return;
        const records = getResourceSchemaRecords(schema);
        setResourceSchema(records.length > 0 ? schema : fallbackResourceSchema);
      } catch (error) {
        if (cancelled) return;
        setResourceSchema(fallbackResourceSchema);
        setResourceSchemaError("Using default resource fields.");
      } finally {
        if (!cancelled) setIsResourceSchemaLoading(false);
      }
    };

    fetchResourceSchema();
    return () => {
      cancelled = true;
    };
  }, [fallbackResourceSchema, selectedResourceInstrumentRecord, showCreateResource]);

  useEffect(() => {
    const nextValues: Record<string, any> = {};
    resourceSchemaProperties.forEach((property: any) => {
      const key = String(property.name ?? property.displayName ?? "");
      nextValues[key] = getResourcePropertyDefaultValue(property);
    });
    setResourceSchemaValues(nextValues);
  }, [resourceSchemaProperties]);

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

  const renderResourceSchemaField = (property: any) => {
    const key = String(property.name ?? property.displayName ?? "");
    const label = String(property.displayName ?? property.name ?? "");
    const editorType = String(property.editorType ?? "").trim().toLowerCase();
    const value = resourceSchemaValues[key];
    const options = property.enumValues ?? property.options ?? [];
    const updateValue = (nextValue: any) =>
      setResourceSchemaValues((values) => ({ ...values, [key]: nextValue }));
    const labelNode = (
      <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
        {label}
      </label>
    );
    const inputClass =
      "w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

    if (editorType === "hidden") return null;

    if (editorType === "checkbox" || editorType === "boolean" || typeof value === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between gap-3">
          <label className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateValue(event.target.checked)}
            className="accent-primary"
          />
        </div>
      );
    }

    if (options.length > 0 || editorType === "select" || editorType === "dropdown") {
      return (
        <div key={key}>
          {labelNode}
          <select
            value={value ?? ""}
            onChange={(event) => updateValue(event.target.value)}
            className={inputClass}
          >
            <option value="">Select one</option>
            {options.map((option: any) => {
              const optionValue = String(option?.value ?? option);
              const optionLabel = String(option?.label ?? option);
              return (
                <option key={optionValue} value={optionValue}>
                  {optionLabel}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    if (editorType === "number" || editorType === "integer") {
      return (
        <div key={key}>
          {labelNode}
          <input
            type="number"
            step={editorType === "integer" ? "1" : "any"}
            value={value ?? ""}
            onChange={(event) =>
              updateValue(event.target.value === "" ? "" : Number(event.target.value))
            }
            className={inputClass}
          />
        </div>
      );
    }

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
    const stepType = String(step.type ?? "unknown");

    return {
      id: String(step.stepId ?? step.path ?? crypto.randomUUID()),
      name: String(step.name ?? "Unnamed Step"),
      type: stepType,
      status: "pending",
      enabled: Boolean(step.enabled ?? true),
      description: String(step.path ?? ""),
      properties: Array.isArray(step.properties)
        ? step.properties.map(toEditorProperty)
        : [],
      children: children.length > 0 ? children : undefined,
      stepTypeName: stepType,
      typeName: stepType,
      fullName: stepType,
      className: stepType,
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

  const instrumentToLibraryItem = (instrument: any) => ({
    id: `instrument:${instrument.name}:${instrument.assembly}`,
    name: instrument.name,
    category: "Instruments",
    type: "instrument",
    description: `Instrument from ${instrument.assembly}`,
    baseType: instrument.baseType,
    assembly: instrument.assembly,
    defaultProps: [
      {
        key: "instrumentName",
        label: "Instrument Name",
        type: "string",
        value: instrument.name,
        group: "Instrument",
      },
      {
        key: "baseType",
        label: "Base Type",
        type: "string",
        value: instrument.baseType,
        group: "Instrument",
      },
      {
        key: "assembly",
        label: "Assembly",
        type: "string",
        value: instrument.assembly,
        group: "Instrument",
      },
    ],
  });

  const propertiesPanel = (
    <PropertiesPanel
      selectedStep={selectedStep}
      selectedId={selectedId}
      plan={plan}
      instruments={instruments}
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
      className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden"
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
        handleSave={handleSaveAndMarkClean}
        handleRun={handleRun}
        handleStop={handleStop}
        handlePause={handlePause}
        handleReset={handleReset}
        handleExportPlan={handleExportPlan}
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
            <Splitter dir="h" onMouseDown={dragLeft} />
          </>
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

        {rightOpen && (
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
        )}
      </div>

      {showInstrumentsPanel && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => {
            setShowInstrumentsPanel(false);
            setInstrumentSearch("");
          }}
        >
          <div
            className="bg-card border border-border w-[660px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  Instruments
                </span>
              </div>
              <button
                onClick={() => {
                  setShowInstrumentsPanel(false);
                  setInstrumentSearch("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  value={instrumentSearch}
                  onChange={(e) => setInstrumentSearch(e.target.value)}
                  placeholder="Search instruments..."
                  className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
                {instrumentSearch && (
                  <button
                    onClick={() => setInstrumentSearch("")}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isInstrumentsLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Loading instruments...
                </div>
              ) : isInstrumentsError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
                  Unable to load instruments.
                </div>
              ) : filteredInstruments.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  {instrumentSearch
                    ? "No matching instruments."
                    : "No instruments available."}
                </div>
              ) : (
                filteredInstruments.map((instrument) => (
                  <div
                    key={`${instrument.name}:${instrument.assembly}`}
                    className="px-5 py-4 border-b border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-foreground">
                            {instrument.name}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">
                            {instrument.baseType}
                          </span>
                        </div>
                        <div className="text-[12px] text-muted-foreground mb-1">
                          {instrument.assembly}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {filteredInstruments.length} instruments
            </div>
          </div>
        </div>
      )}

      {showDutsPanel && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => {
            setShowDutsPanel(false);
            setDutSearch("");
          }}
        >
          <div
            className="bg-card border border-border w-[660px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  DUTs
                </span>
              </div>
              <button
                onClick={() => {
                  setShowDutsPanel(false);
                  setDutSearch("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  value={dutSearch}
                  onChange={(e) => setDutSearch(e.target.value)}
                  placeholder="Search DUTs..."
                  className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
                {dutSearch && (
                  <button
                    onClick={() => setDutSearch("")}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isDutsLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Loading DUTs...
                </div>
              ) : isDutsError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
                  Unable to load DUTs.
                </div>
              ) : filteredDuts.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  {dutSearch ? "No matching DUTs." : "No DUTs available."}
                </div>
              ) : (
                filteredDuts.map((dut: any, index: number) => (
                  <div
                    key={`${dut.name}:${dut.serialNumber}:${index}`}
                    className="px-5 py-4 border-b border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[13px] font-semibold text-foreground">
                            {dut.name || "Unnamed DUT"}
                          </span>
                          {dut.baseType && (
                            <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">
                              {dut.baseType}
                            </span>
                          )}
                          {dut.model && (
                            <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">
                              {dut.model}
                            </span>
                          )}
                          {dut.serialNumber && (
                            <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">
                              SN: {dut.serialNumber}
                            </span>
                          )}
                        </div>
                        {dut.firmware && (
                          <div className="text-[12px] text-muted-foreground mb-1">
                            Firmware: {dut.firmware}
                          </div>
                        )}
                        {dut.assembly && (
                          <div className="text-[11px] text-muted-foreground/70 font-mono">
                            {dut.assembly}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {filteredDuts.length} DUTs
            </div>
          </div>
        </div>
      )}

      {showResourcesPanel && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => {
            setShowResourcesPanel(false);
            setShowCreateResource(false);
            setResourceSearch("");
          }}
        >
          <div
            className="bg-card border border-border w-[760px] max-w-[92vw] h-[540px] max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  Resources
                </span>
              </div>
              <button
                onClick={() => {
                  setShowResourcesPanel(false);
                  setShowCreateResource(false);
                  setResourceSearch("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 border border-border px-2.5 py-2 bg-background">
                  <Search
                    size={13}
                    className="text-muted-foreground shrink-0"
                  />
                  <input
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources..."
                    className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {resourceSearch && (
                    <button
                      onClick={() => setResourceSearch("")}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateResource(true)}
                  className="flex h-[34px] items-center gap-2 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus size={12} /> Create New Resource
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] gap-3 px-5 py-3 border-b border-border bg-muted/20 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                <div>Name</div>
                <div>Instrument</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredResourcePlans.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  {resourceSearch
                    ? "No matching resources."
                    : "No resources available."}
                </div>
              ) : (
                filteredResourcePlans.map((resource) => (
                  <div
                    key={resource.id}
                    className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] gap-3 px-5 py-4 border-b border-border text-[12px] font-mono"
                  >
                    <div className="font-semibold text-foreground">
                      {resource.name}
                    </div>
                    <div className="text-muted-foreground">
                      {resource.instrument}
                    </div>
                    <div className="text-emerald-500 font-semibold">
                      {resource.status}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-primary hover:text-primary/80"
                        title="Edit resource"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-400"
                        title="Delete resource"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono flex items-center">
              <span>{filteredResourcePlans.length} resources</span>
              <div className="ml-auto flex items-center gap-3">
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-40" disabled>
                  <ChevronLeft size={14} />
                </button>
                <span>1 / 1</span>
                <button className="text-muted-foreground hover:text-foreground disabled:opacity-40" disabled>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateResource && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60]"
          onClick={closeCreateResourceModal}
        >
          <div
            className="bg-card border border-border w-[520px] max-w-[92vw] max-h-[88vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <span className="text-[13px] font-semibold text-foreground">
                Create {selectedResourceInstrument || "Resource"}
              </span>
              <button
                onClick={closeCreateResourceModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Instrument
                </label>
                <select
                  value={selectedResourceInstrument}
                  onChange={(event) => setSelectedResourceInstrument(event.target.value)}
                  className="w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select instrument</option>
                  {browsableResourceInstruments.map((instrument: any) => (
                    <option key={`${instrument.name}:${instrument.assembly}`} value={instrument.name}>
                      {instrument.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Plan Name
                </label>
                <input
                  value={resourcePlanName}
                  onChange={(event) => setResourcePlanName(event.target.value)}
                  placeholder="Enter plan name"
                  className="w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {isResourceSchemaLoading ? (
                <div className="py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Loading resource schema...
                </div>
              ) : selectedResourceInstrument ? (
                <>
                  {resourceSchemaError && (
                    <div className="border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[12px] font-mono text-muted-foreground">
                      {resourceSchemaError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {resourceSchemaProperties.map(renderResourceSchemaField)}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Select an instrument to load resource fields.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
              <button
                onClick={closeCreateResourceModal}
                className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSaveResource}
                disabled={!selectedResourceInstrument || isResourceSchemaLoading}
                className="h-8 px-4 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Save size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestPlansPanel && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setShowTestPlansPanel(false)}
        >
          <div
            className="bg-card border border-border w-[760px] max-w-[92vw] h-[540px] max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">
                  Test Plans
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTestPlansPanel(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex w-full items-center gap-2">
                <div className="flex flex-1 items-center gap-2 border border-border px-2.5 py-2 bg-background">
                  <Search
                    size={13}
                    className="text-muted-foreground shrink-0"
                  />
                  <input
                    value={testPlanQuery}
                    onChange={(e) => setTestPlanQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchTestPlans();
                    }}
                    placeholder="Search test plans..."
                    className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {testPlanQuery && (
                    <button
                      onClick={() => setTestPlanQuery("")}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearchTestPlans}
                  className="flex h-[34px] items-center gap-2 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Search size={12} /> Search
                </button>
              </div>
            </div>
            {showUnsavedPlanWarning && (
              <div className="mx-4 mt-2 border border-yellow-500/30 bg-yellow-500/10 shadow-sm">
                <div className="flex items-start gap-3 px-3 py-2">
                  <AlertTriangle
                    size={16}
                    className="text-yellow-500 shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-foreground">
                      Save changes before loading another test plan
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                      Your current test plan has unsaved sequence or property
                      changes. Click Save before opening
                      {pendingTestPlan?.name
                        ? ` "${pendingTestPlan.name}"`
                        : " another test plan"}
                      .
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setShowUnsavedPlanWarning(false);
                        setPendingTestPlan(null);
                      }}
                      className="h-8 px-3 border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await handleSaveAndMarkClean();
                      }}
                      className="h-8 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {openTestPlanError && (
                <div className="px-5 py-3 border-b border-border text-[12px] font-mono text-destructive">
                  {openTestPlanError}
                </div>
              )}
              {isTestPlansLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Searching Test Plans..
                </div>
              ) : isTestPlansError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
                  Unable to load test plans.
                </div>
              ) : hasSearchedTestPlans && testPlans.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  No testplans found.
                </div>
              ) : (
                testPlans.map((plan: any, index: number) => {
                  const isOpening = openingTestPlanPath === plan.path;
                  return (
                    <button
                      key={`${plan.path}:${index}`}
                      onClick={() => handleOpenTestPlan(plan)}
                      disabled={!!openingTestPlanPath}
                      title={String(plan.path ?? "").replace(/\\/g, "\\\\")}
                      className="relative w-full text-left px-5 py-4 border-b border-border transition-colors group hover:bg-secondary/60 focus:bg-primary/8 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {plan.name}
                          </span>
                          <span className="text-[12px] text-muted-foreground truncate group-hover:text-foreground/70 transition-colors">
                            {String(plan.path ?? "").replace(/\\/g, "\\\\")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-muted-foreground border border-border px-2 py-0.5 whitespace-nowrap">
                            {plan.stepCount} steps
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground border border-border px-2 py-0.5 whitespace-nowrap">
                            {new Date(plan.lastModified).toLocaleString()}
                          </span>
                          <ChevronRight
                            size={14}
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          />
                        </div>
                      </div>
                      {isOpening && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-[1px]">
                          <Loader2
                            size={16}
                            className="animate-spin text-primary"
                          />
                          <span className="ml-2 text-[12px] font-mono text-primary">
                            Opening...
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {testPlans.length} test plans
            </div>
          </div>
        </div>
      )}

      {showConsole && (
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
        library={library}
        handleAddStep={handleAddStep}
        addStepParentId={addStepParentId}
        addStepIdx={addStepIdx}
        instruments={instruments}
        duts={duts}
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
    </div>
  );
}
