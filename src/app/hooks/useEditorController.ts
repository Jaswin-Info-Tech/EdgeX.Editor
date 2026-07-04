import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "sonner";
import { useDragResize } from "../components/editor/resizable";
// import { BASE_LIBRARY } from "../data/library";
import type { CtxMenu, LibraryItem, LogEntry, PlanMeta, Plugin, RunState, StepStatus, TestStep } from "../types/editor";
import { addToParent, deleteIn, flatAll, makeSequence, makeStep, moveIn, nowTs, parseFreq, resetAll, setStatusIn, uid, updateIn, toArray } from "../utils/editor";
import { removePlugin, uploadPlugin } from "../api/plugin";
import { installPackage, uninstallPackage } from "../api/package";
import { useAvailablePackages } from "./usePackage";
import {
  useInstalledPlugins,
  useDuts,
  usePlugins,
  useInstruments,
  useConnections,
  useResultListeners,
  useTraceListeners,
} from "./usePlugin";
import { useWindowWidth } from "./useWindowWidth";
import { useDebounce } from "./useDebounce";
import { moveStepToPosition } from "../utils/editor";
import { composeTestPlan, runTestPlan } from "../api/plugin";




export function useEditorController() {
  const winW = useWindowWidth();
  const isDesktop = winW >= 1280;
  const isTablet = winW >= 768 && winW < 1024;
  const [installedSearch, setInstalledSearch] = useState("");
  const [browseSearch, setBrowseSearch] = useState("");
  const debouncedInstalledSearch = useDebounce(installedSearch);
  const debouncedBrowseSearch = useDebounce(browseSearch);

  const {
    data: installedPluginsData,
    refetch: refetchInstalledPlugins,
    isFetching: isInstalledPluginsFetching,
  } = useInstalledPlugins(debouncedInstalledSearch);
  const {
    data: availablePackagesData,
    refetch: refetchAvailablePackages,
    isFetching: isAvailablePackagesFetching,
  } = useAvailablePackages(debouncedBrowseSearch);
  const [plan, setPlan] = useState<TestStep[]>([]);
  const [planMeta, setPlanMeta] = useState<PlanMeta>({ name: "Untitled Test Plan", description: "", author: "", version: "1.0.0", dutName: "", dutSerial: "", dutModel: "", dutFirmware: "" });
  const [hasPlan, setHasPlan] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [leftTab, setLeftTab] = useState<"plan" | "library" | "plugins" | "instruments">("library");
  const [runState, setRunState] = useState<RunState>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleFilter, setConsoleFilter] = useState<"ALL" | LogEntry["level"]>("ALL");
  const [libSearch, setLibSearch] = useState("");
  const [libFilterOpen, setLibFilterOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dragOverSequenceId, setDragOverSequenceId] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [contextMenu, setContextMenu] = useState<CtxMenu | null>(null);
  const [addStepParentId, setAddStepParentId] = useState<string | null>(null);
  const [addStepIdx, setAddStepIdx] = useState<number | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedPlanSignature, setSavedPlanSignature] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [leftW, setLeftW] = useState(isDesktop ? 232 : 200);
  const [rightW, setRightW] = useState(isDesktop ? 280 : 248);
  const [consoleH, setConsoleH] = useState(176);

  const dragLeft = useDragResize("h", useCallback((delta: number) => setLeftW(width => Math.max(140, Math.min(480, width + delta))), []));
  const dragRight = useDragResize("h", useCallback((delta: number) => setRightW(width => Math.max(180, Math.min(520, width - delta))), []));
  const dragConsole = useDragResize("v", useCallback((delta: number) => setConsoleH(height => Math.max(60, Math.min(500, height - delta))), []));

  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showPluginMgr, setShowPluginMgr] = useState(false);
  const [showSystemKpis, setShowSystemKpis] = useState(false);

  const [dragLibItem, setDragLibItem] = useState<LibraryItem | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const logId = useRef(1);
  const logEndRef = useRef<HTMLDivElement>(null);
  const runTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const renameRef = useRef<HTMLInputElement>(null);

  const formatStepForSave = useCallback((step: TestStep): any => {
    const props = (step.properties || []).reduce((acc: Record<string, any>, prop: any) => {
      acc[prop.label] = prop.value;
      return acc;
    }, {});

    const stepTypeName = step.stepTypeName
      ?? step.typeName
      ?? step.fullName
      ?? step.className
      ?? step.name;

    const formattedStep: any = {
      stepTypeName,
      ...(step.name && { name: step.name }),
      properties: props,
    };

    if (step.children?.length) {
      formattedStep.children = step.children.map(formatStepForSave);
    }

    return formattedStep;
  }, []);

  const buildSaveSignature = useCallback((steps: TestStep[], meta: PlanMeta) => {
    return JSON.stringify({
      outputPath: `D:\\plans\\${meta.name}.TapPlan`,
      overwrite: true,
      steps: steps.map(formatStepForSave),
    });
  }, [formatStepForSave]);

  const currentSaveSignature = useMemo(
    () => buildSaveSignature(plan, planMeta),
    [buildSaveSignature, plan, planMeta],
  );

  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    if (!hasPlan || !savedPlanSignature) {
      setIsSaved(false);
      return;
    }
    setIsSaved(currentSaveSignature === savedPlanSignature);
  }, [currentSaveSignature, hasPlan, savedPlanSignature]);
  useEffect(() => {
    const asBool = (value: unknown, fallback = false) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
      }
      if (typeof value === "number") return value !== 0;
      return fallback;
    };

    const normalizePackagePlugin = (item: any, fallbackInstalled: boolean, index: number): Plugin => {
      const statusInstalled = String(item.status ?? "").trim().toLowerCase() === "installed";
      const isInstalled = item.isInstalled === undefined
        ? fallbackInstalled || statusInstalled
        : asBool(item.isInstalled, fallbackInstalled || statusInstalled);
      const name = String(item.name ?? item.packageName ?? item.pluginName ?? "Untitled Plugin");
      const packageName = item.packageName === undefined ? undefined : String(item.packageName);
      const pluginName = item.pluginName === undefined ? undefined : String(item.pluginName);
      const version = String(item.version ?? "");
      const id = String(item.id ?? packageName ?? pluginName ?? `${name}:${version}:${index}`);
      return {
        ...item,
        id,
        name,
        version,
        author: String(item.author ?? item.publisher ?? ""),
        description: String(item.description ?? ""),
        state: isInstalled ? "installed" : "available",
        isInstalled,
        packageName,
        pluginName,
        uninstallName: String(pluginName ?? packageName ?? name),
        updateAvailable: asBool(item.updateAvailable),
        status: String(item.status ?? (isInstalled ? "Installed" : "Available")),
        steps: Array.isArray(item.steps) ? item.steps : [],
      };
    };

    const availableCatalog = toArray(availablePackagesData).map((item: any, index) => normalizePackagePlugin(item, false, index));
    setPlugins(availableCatalog);
  }, [availablePackagesData]);

  useEffect(() => {
    const normalizeInstalledPlugin = (item: any, index: number): Plugin => {
      const name = String(item.name ?? item.pluginName ?? item.packageName ?? "Untitled Plugin");
      const assembly = String(item.assembly ?? "");
      const baseType = String(item.baseType ?? "");
      const packageName = item.packageName === undefined ? undefined : String(item.packageName);
      const pluginName = item.pluginName === undefined ? undefined : String(item.pluginName);
      const uninstallName = packageName || pluginName || assembly || name;

      return {
        ...item,
        id: String(item.id ?? `${assembly || "plugin"}:${name}:${index}`),
        name,
        packageName,
        pluginName,
        version: String(item.version ?? ""),
        author: String(item.author ?? item.publisher ?? assembly),
        description: baseType || assembly || "Installed plugin",
        state: "installed",
        isInstalled: true,
        status: "Installed",
        assembly,
        baseType,
        canCreateInstance: Boolean(item.canCreateInstance),
        isBrowsable: Boolean(item.isBrowsable),
        uninstallName,
        steps: baseType.includes("TestStep")
          ? [{
            id: String(item.id ?? name),
            name,
            category: assembly || "Plugins",
            description: baseType,
            type: "plugin",
            baseType,
            assembly,
            defaultProps: [],
          }]
          : [],
      };
    };

    setInstalledPlugins(toArray(installedPluginsData).map((item: any, index) => normalizeInstalledPlugin(item, index)));
  }, [installedPluginsData]);

  const addLog = useCallback((level: LogEntry["level"], source: string, message: string) => {
    setLogs(prev => [...prev, { id: logId.current++, timestamp: nowTs(), level, source, message }]);
  }, []);

  const logApiErrorDetails = useCallback((
    source: string,
    error: unknown,
    defaults?: { method?: string; url?: string },
  ) => {
    const asRecord = (value: unknown): Record<string, unknown> | null => {
      if (value && typeof value === "object") return value as Record<string, unknown>;
      return null;
    };

    const stringify = (value: unknown) => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    const cleanServerErrorText = (raw: string) => {
      const normalized = raw.replace(/\r/g, "\n");

      const exceptionMatch = normalized.match(/([A-Za-z0-9_.]+Exception)\s*:\s*([^\n]+)/);
      if (exceptionMatch) {
        return `${exceptionMatch[1]}: ${exceptionMatch[2].trim()}`;
      }

      const filteredLine = normalized
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .find((line) => {
          if (/^l:\s*/i.test(line)) return false;
          if (/Microsoft\.AspNetCore\.Diagnostics\.ExceptionHandlerMiddleware/i.test(line)) return false;
          if (/An unhandled exception has occurred while executing the request\.?/i.test(line)) return false;
          return true;
        });

      if (filteredLine) {
        return filteredLine;
      }

      return normalized.replace(/\s+/g, " ").trim();
    };

    const lines: string[] = [];
    const errorObj = asRecord(error);
    const responseObj = asRecord(errorObj?.response);
    const requestConfig = asRecord(errorObj?.config);
    const responseData = responseObj?.data;
    const responseHeaders = asRecord(responseObj?.headers);

    const method = String(requestConfig?.method ?? defaults?.method ?? "GET").toUpperCase();
    const url = String(requestConfig?.url ?? defaults?.url ?? "unknown-endpoint");
    const status = responseObj?.status;
    const statusText = responseObj?.statusText;

    lines.push(`Request: ${method} ${url}`);
    if (typeof status === "number") {
      lines.push(`HTTP: ${status}${statusText ? ` ${String(statusText)}` : ""}`);
    }

    if (typeof errorObj?.message === "string" && errorObj.message.trim()) {
      lines.push(`Message: ${errorObj.message}`);
    }

    const dataRecord = asRecord(responseData);
    if (dataRecord) {
      const directMessage =
        stringify(dataRecord.message) ||
        stringify(dataRecord.error) ||
        stringify(dataRecord.title) ||
        stringify(dataRecord.detail);
      if (directMessage) {
        lines.push(`API: ${cleanServerErrorText(directMessage)}`);
      }

      const errorsBag = dataRecord.errors;
      const errorsRecord = asRecord(errorsBag);
      if (errorsRecord) {
        Object.entries(errorsRecord).forEach(([field, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              lines.push(`Validation: ${field} -> ${cleanServerErrorText(stringify(item))}`);
            });
          } else {
            lines.push(`Validation: ${field} -> ${cleanServerErrorText(stringify(value))}`);
          }
        });
      }

      if (lines.length <= 4) {
        lines.push(`Payload: ${stringify(responseData)}`);
      }
    } else if (responseData != null) {
      const rawPayload = stringify(responseData);
      lines.push(`API: ${cleanServerErrorText(rawPayload)}`);
      lines.push(`Payload: ${rawPayload}`);
    }

    if (responseHeaders?.["x-correlation-id"]) {
      lines.push(`CorrelationId: ${String(responseHeaders["x-correlation-id"])}`);
    }

    lines.forEach((line) => addLog("ERROR", source, line));
  }, [addLog]);

  const logApiSuccessDetails = useCallback((source: string, action: string, response: unknown) => {
    const asRecord = (value: unknown): Record<string, unknown> | null => {
      if (value && typeof value === "object") return value as Record<string, unknown>;
      return null;
    };

    const stringify = (value: unknown) => {
      if (value == null) return "";
      if (typeof value === "string") return value;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    };

    const responseObj = asRecord(response);
    const payload = asRecord(responseObj?.data) ?? responseObj;

    addLog("INFO", source, `${action} API response received.`);

    if (!payload) {
      const raw = stringify(response);
      if (raw) addLog("INFO", source, `Response: ${raw}`);
      return;
    }

    const preferredFields = action === "Run"
      ? [
        "runId",
        "planName",
        "path",
        "verdict",
        "duration",
        "failedToStart",
      ]
      : [
        "status",
        "success",
        "message",
        "runId",
        "id",
        "path",
        "state",
        "result",
        "timestampUtc",
        "startedAt",
        "durationMs",
      ];

    const summaryPairs: string[] = [];
    preferredFields.forEach((key) => {
      const value = payload[key];
      if (value == null) return;
      if (typeof value === "object") return;
      summaryPairs.push(`${key}=${stringify(value)}`);
    });

    if (summaryPairs.length > 0) {
      for (let index = 0; index < summaryPairs.length; index += 4) {
        addLog("INFO", source, `Response: ${summaryPairs.slice(index, index + 4).join(" | ")}`);
      }
    }

    const normalizedEntries = Object.entries(payload)
      .filter(([key, value]) => !preferredFields.includes(key) && value != null && typeof value !== "object")
      .slice(0, 8);

    if (normalizedEntries.length > 0) {
      const extras = normalizedEntries.map(([key, value]) => `${key}=${stringify(value)}`);
      for (let index = 0; index < extras.length; index += 4) {
        addLog("INFO", source, `Response extra: ${extras.slice(index, index + 4).join(" | ")}`);
      }
    }

    const parameters = Array.isArray(payload?.parameters) ? payload.parameters : [];
    if (parameters.length > 0) {
      const grouped: Record<string, string[]> = {};
      parameters.forEach((entry: any) => {
        const name = stringify(entry?.name || "Parameter").trim() || "Parameter";
        const value = stringify(entry?.value);
        grouped[name] = grouped[name] ?? [];
        grouped[name].push(value);
      });

      addLog("INFO", source, `Parameters (${parameters.length})`);
      const orderedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
      const normalizedParams = orderedKeys.map((key) => {
        const values = grouped[key];
        const merged = values.length > 1 ? values.join(", ") : values[0];
        return `${key}=${merged}`;
      });

      for (let index = 0; index < normalizedParams.length; index += 3) {
        addLog("INFO", source, `Param: ${normalizedParams.slice(index, index + 3).join(" | ")}`);
      }
    }

    if (normalizedEntries.length === 0 && preferredFields.every((key) => payload[key] == null)) {
      const raw = stringify(payload);
      if (raw) {
        addLog("INFO", source, `Response: ${raw.slice(0, 1200)}`);
      }
    }
  }, [addLog]);

  const { data } = usePlugins();

  const library: LibraryItem[] = useMemo(() => {
    const apiSteps = Array.isArray(data) ? data : [];

    const pluginSteps = plugins
      .filter(plugin => plugin.state === "installed")
      .flatMap(plugin =>
        (plugin.steps ?? []).map(step => ({
          ...step,
          pluginId: plugin.id,
        }))
      );

    return [...apiSteps, ...pluginSteps];
  }, [data, plugins]);

  const { data: instruments, isLoading: isInstrumentsLoading, isError: isInstrumentsError } = useInstruments();
  const { data: duts, isLoading: isDutsLoading, isError: isDutsError } = useDuts();
  const { data: connections, isLoading: isConnectionsLoading, isError: isConnectionsError } = useConnections();
  const {
    data: resultListeners,
    isLoading: isResultListenersLoading,
    isError: isResultListenersError,
  } = useResultListeners();
  const {
    data: traceListeners,
    isLoading: isTraceListenersLoading,
    isError: isTraceListenersError,
  } = useTraceListeners();

  const selectedStep = selectedId ? flatAll(plan).find(step => step.id === selectedId) : null;
  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const stats = (() => {
    const all = flatAll(plan).filter(step => !step.children);
    return {
      total: all.length,
      passed: all.filter(step => step.status === "passed").length,
      failed: all.filter(step => step.status === "failed").length,
      enabled: all.filter(step => step.enabled).length,
    };
  })();

  const handleCreatePlan = (meta: PlanMeta) => {
    setPlanMeta(meta);
    setPlan([]);
    setSelectedId(null);
    setExpanded(new Set());
    setRunState("idle");
    setLogs([]);
    setHasPlan(true);
    setSavedPlanSignature(null);
    setIsSaved(false);
    setShowNewPlan(false);
    setLeftTab("library");
    addLog("INFO", "EdgeX", `Plan created: "${meta.name}"`);
    if (meta.dutName) addLog("INFO", "DUT", `DUT: ${meta.dutName} (${meta.dutSerial || "no SN"})`);
  };

  const handleAddGroup = () => {
    const sequence = makeSequence();
    setPlan(prev => [...prev, sequence]);
    setExpanded(prev => new Set([...prev, sequence.id]));
    setSelectedId(sequence.id);
    setLeftTab("plan");
    addLog("INFO", "Plan", `Added sequence: "${sequence.name}"`);
  };

  const handleAddStep = (item: LibraryItem, parentId?: string | null, atIdx?: number, switchTab: boolean = true) => {
    if (!hasPlan) return;

    const step = makeStep(item);
    const pid = parentId !== undefined ? parentId : addStepParentId;
    const idx = atIdx !== undefined ? atIdx : addStepIdx;
    setPlan(prev => addToParent(prev, pid ?? null, step, idx));
    if (pid) setExpanded(prev => new Set([...prev, pid]));
    setSelectedId(step.id);
    if (switchTab) setLeftTab("plan");
    addLog("INFO", "Plan", `Added: "${step.name}"`);
  };

  const handleContextAction = (action: string, stepId: string) => {
    const step = flatAll(plan).find(item => item.id === stepId);
    if (!step) return;

    if (action === "delete") {
      setPlan(prev => deleteIn(prev, stepId));
      setSelectedId(null);
      addLog("INFO", "Plan", `Deleted: "${step.name}"`);
    } else if (action === "move_up") {
      setPlan(prev => moveIn(prev, stepId, "up"));
    } else if (action === "move_down") {
      setPlan(prev => moveIn(prev, stepId, "down"));
    } else if (action === "duplicate") {
      const clone: TestStep = { ...step, id: uid(), name: `${step.name} (copy)`, status: "pending", children: step.children?.map(child => ({ ...child, id: uid(), status: "pending" as StepStatus })) };
      setPlan(prev => addToParent(prev, null, clone));
      setSelectedId(clone.id);
    } else if (action === "rename") {
      setRenaming(stepId);
      setRenameVal(step.name);
    } else if (action === "toggle") {
      setPlan(prev => updateIn(prev, stepId, item => ({ ...item, enabled: !item.enabled })));
    } else if (action === "add_after") {
      setAddStepParentId(null);
      setShowAddStep(true);
    } else if (action === "add_child") {
      setAddStepParentId(stepId);
      setShowAddStep(true);
    } else if (action === "breakpoint") {
      setPlan(prev => updateIn(prev, stepId, item => ({ ...item, breakpoint: !item.breakpoint })));
    }
  };

  const commitRename = () => {
    if (renaming && renameVal.trim()) {
      setPlan(prev => updateIn(prev, renaming, step => ({ ...step, name: renameVal.trim() })));
    }
    setRenaming(null);
  };

  const updateProperty = (stepId: string, key: string, raw: string) => {
    setPlan(prev => updateIn(prev, stepId, step => ({
      ...step,
      properties: step.properties.map(prop => {
        if (prop.key !== key) return prop;
        if (prop.isEditable === false) return prop;
        if (prop.type === "number") return { ...prop, value: parseFloat(raw) || 0 };
        if (prop.type === "boolean") return { ...prop, value: raw === "true" };
        if (prop.type === "frequency") return { ...prop, value: parseFreq(raw) };
        return { ...prop, value: raw };
      }),
    })));
  };

  const handleRun = async () => {
    if (runState === "running" || plan.length === 0 || !isSaved) return;
    runTimers.current.forEach(clearTimeout);
    setPlan(resetAll);
    setLogs([]);
    setRunState("running");
    setShowConsole(true);

    const runPath = "D:\\plans\\SamplePlan.TapPlan";
    addLog("INFO", "EdgeX", `=== Run started - "${planMeta.name}" ===`);
    addLog("INFO", "TestPlans", `Run request: ${runPath}`);

    try {
      const runResponse = await runTestPlan({
        path: runPath,
        cacheXml: true,
      });
      logApiSuccessDetails("TestPlans", "Run", runResponse);

      const asRecord = (value: unknown): Record<string, unknown> | null => {
        if (value && typeof value === "object") return value as Record<string, unknown>;
        return null;
      };
      const stringify = (value: unknown) => {
        if (value == null) return "";
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };
      const payload = asRecord(runResponse);
      const parameters = Array.isArray(payload?.parameters) ? payload.parameters : [];
      const findParam = (name: string) => {
        const match = parameters.find(
          (entry: any) => String(entry?.name ?? "").toLowerCase() === name.toLowerCase(),
        );
        return match ? stringify(match.value) : "";
      };

      const verdictRaw = payload?.verdict;
      const verdictFromParam = findParam("Verdict");
      const verdictMap: Record<string, string> = {
        "0": "NotSet",
        "1": "Pass",
        "2": "Fail",
        "3": "Inconclusive",
        "4": "Aborted",
        "5": "Error",
      };
      const verdict = verdictFromParam || verdictMap[String(verdictRaw)] || stringify(verdictRaw) || "Unknown";
      const duration = stringify(payload?.duration) || findParam("Duration") || "-";
      const runId = stringify(payload?.runId) || "-";
      const failedToStart = String(payload?.failedToStart ?? "false").toLowerCase() === "true";

      addLog("INFO", "EdgeX", `Run summary: id=${runId} | verdict=${verdict} | duration=${duration}`);

      if (failedToStart) {
        addLog("ERROR", "EdgeX", "=== Run complete - Failed to start ===");
        setRunState("idle");
      } else {
        addLog("INFO", "EdgeX", "=== Run complete ===");
        setRunState("completed");
      }
    } catch (error) {
      console.error("Failed to run test plan:", error);
      setShowConsole(true);
      addLog("ERROR", "TestPlans", "Failed to start test plan run.");
      logApiErrorDetails("TestPlans", error, { method: "POST", url: "testplans/run" });
      setRunState("idle");
    }
  };

  const handleStop = () => {
    runTimers.current.forEach(clearTimeout);
    setRunState("idle");
    addLog("WARN", "EdgeX", "Run aborted by user.");
  };

  const handlePause = () => {
    if (runState === "running") {
      setRunState("paused");
      addLog("WARN", "EdgeX", "Run paused.");
    } else if (runState === "paused") {
      setRunState("running");
      addLog("INFO", "EdgeX", "Run resumed.");
    }
  };

  const handleReset = () => {
    runTimers.current.forEach(clearTimeout);
    setRunState("idle");
    setPlan(resetAll);
    setLogs([{ id: logId.current++, timestamp: nowTs(), level: "INFO", source: "EdgeX", message: "Plan reset. Ready." }]);
  };


  const handleStepReorder = (stepId: string, newParentId: string | null, newIdx: number) => {
    setPlan(prev => moveStepToPosition(prev, stepId, newParentId, newIdx));
    if (newParentId) setExpanded(prev => new Set([...prev, newParentId]));
    setDraggedStepId(null);
    //addLog("INFO", "Plan", `Reordered step`);
  };

  const refreshPluginData = useCallback(() => {
    refetchInstalledPlugins();
    refetchAvailablePackages();
  }, [refetchInstalledPlugins, refetchAvailablePackages]);

  const handleInstallPlugin = async (id: string) => {
    const plugin = plugins.find(item => item.id === id);
    const pluginName = plugin?.name ?? "Plugin";
    const action = plugin?.isInstalled ? "updated" : "installed";
    const actionLabel = action === "updated" ? "Update" : "Install";
    const toastId = toast.loading(`${actionLabel} started for ${pluginName}...`);

    try {
      setPlugins(prev => prev.map(item => item.id === id ? { ...item, state: "installing" } : item));
      await installPackage(pluginName);
      setPlugins(prev => prev.map(item => item.id === id
        ? { ...item, state: "installed", isInstalled: true, status: "Installed", updateAvailable: false }
        : item
      ));
      addLog("INFO", "Plugins", `${action === "updated" ? "Updated" : "Installed"}: ${pluginName}`);
      toast.success(`${pluginName} ${action} successfully`, { id: toastId });
      refreshPluginData();
      setTimeout(refreshPluginData, 1500); // safety net in case backend hasn't registered the install yet
    } catch (error) {
      setPlugins(prev => prev.map(item => item.id === id
        ? { ...item, state: item.isInstalled ? "installed" : "available" }
        : item
      ));
      setShowConsole(true);
      addLog("ERROR", "Plugins", `Unable to ${action === "updated" ? "update" : "install"}: ${pluginName}`);
      logApiErrorDetails("Plugins", error, { method: "POST", url: "package/install" });
      toast.error(`Failed to ${action === "updated" ? "update" : "install"} ${pluginName}`, { id: toastId });
    }
  };

  const handleUninstallPlugin = async (id: string) => {
    const plugin = installedPlugins.find(item => item.id === id);
    const pluginName = plugin?.name ?? "Plugin";
    const uninstallName = plugin?.uninstallName ?? pluginName;
    const toastId = toast.loading(`Removing ${pluginName}...`);
    console.log("Uninstalling:", { id, pluginName, uninstallName, plugin });
    try {
      const result = await removePlugin({
        pluginName: uninstallName,
        packageName: plugin?.packageName,
        assembly: plugin?.assembly,
      });
      console.log("Uninstall API response:", result);
      setInstalledPlugins(prev => prev.filter(item =>
        item.id !== id &&
        item.uninstallName !== uninstallName &&
        item.packageName !== plugin?.packageName &&
        item.pluginName !== plugin?.pluginName &&
        item.assembly !== plugin?.assembly
      ));
      addLog("INFO", "Plugins", `Removed: ${pluginName}`);
      toast.success(`${pluginName} removed successfully`, { id: toastId });

      refreshPluginData();
      setTimeout(refreshPluginData, 1500);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Uninstall API error:", err);
      setShowConsole(true);
      addLog("ERROR", "Plugins", `Unable to uninstall: ${pluginName}`);
      logApiErrorDetails("Plugins", err, { method: "POST", url: "plugins/remove" });
      toast.error(`Failed to remove ${pluginName}`, { id: toastId });
    }
  };
  const handleUninstallPackage = async (id: string) => {
    const plugin = plugins.find(item => item.id === id);
    const pluginName = plugin?.name ?? "Plugin";
    const uninstallName = plugin?.uninstallName ?? pluginName;
    const toastId = toast.loading(`Uninstalling ${pluginName}...`);

    try {
      setPlugins(prev => prev.map(item => item.id === id ? { ...item, state: "uninstalling" } : item));
      await uninstallPackage(uninstallName);

      // Keep it in the list, just flip it back to "available"
      setPlugins(prev => prev.map(item => item.id === id
        ? { ...item, state: "available", isInstalled: false, status: "Available", updateAvailable: false }
        : item
      ));
      // Drop the matching entry from Installed tab too
      setInstalledPlugins(prev => prev.filter(item => item.uninstallName !== uninstallName && item.name !== pluginName));

      addLog("INFO", "Plugins", `Uninstalled: ${pluginName}`);
      toast.success(`${pluginName} uninstalled successfully`, { id: toastId });
      refreshPluginData();
      setTimeout(refreshPluginData, 1500);
    } catch (error) {
      setPlugins(prev => prev.map(item => item.id === id ? { ...item, state: "installed", isInstalled: true } : item));
      setShowConsole(true);
      addLog("ERROR", "Plugins", `Unable to uninstall: ${pluginName}`);
      logApiErrorDetails("Plugins", error, { method: "POST", url: "package/uninstall" });
      toast.error(`Failed to uninstall ${pluginName}`, { id: toastId });
    }
  };

  const handleUploadPlugin = async (file: File) => {
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      await uploadPlugin(file);
      addLog("INFO", "Plugins", `Uploaded: ${file.name}`);
      toast.success(`${file.name} uploaded and installed successfully`, { id: toastId });
      refreshPluginData();
      setTimeout(refreshPluginData, 1500);
    } catch (error) {
      setShowConsole(true);
      addLog("ERROR", "Plugins", `Unable to install: ${file.name}`);
      logApiErrorDetails("Plugins", error, { method: "POST", url: "plugins/upload" });
      toast.error(`Failed to upload ${file.name}`, { id: toastId });
    }

  };




  const formatStepForCompose = (step: TestStep): any => formatStepForSave(step);

  const handleSave = async () => {
    const jsonData = {
      outputPath: `D:\\plans\\${planMeta.name}.TapPlan`,
      overwrite: true,
      steps: plan.map(formatStepForCompose),
    };
    console.log(JSON.stringify(jsonData, null, 2));

    try {
      const response = await composeTestPlan(jsonData);``
      addLog("INFO", "TestPlans", `Saved: ${jsonData.outputPath}`);
      setSavedPlanSignature(currentSaveSignature);
      setIsSaved(true);
      return response;
    } catch (error) {
      console.error("Failed to compose test plan:", error);
      setShowConsole(true);
      addLog("ERROR", "TestPlans", "Failed to save test plan.");
      logApiErrorDetails("TestPlans", error, { method: "POST", url: "plugins/compose" });
    }
  };

  const handleExportPlan = () => {
    const exportData = {
      testplan: {
        name: planMeta.name,
        description: planMeta.description,
        author: planMeta.author,
        version: planMeta.version,
        steps: plan.map(formatStepForCompose),
      },
    };

    console.log(JSON.stringify(exportData, null, 2));

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${planMeta.name || "TestPlan"}.json`;
    a.click();

    URL.revokeObjectURL(url);

    addLog("INFO", "TestPlans", "Plan exported as JSON.");
  };

  const collectExpandedIds = (steps: TestStep[]): Set<string> => {
    const ids = new Set<string>();

    const visit = (step: TestStep) => {
      if (step.children && step.children.length > 0) {
        ids.add(step.id);
        step.children.forEach(visit);
      }
    };

    steps.forEach(visit);

    return ids;
  };

  const convertImportedStep = (step: any): TestStep => {
    return {
      id: crypto.randomUUID(),

      name: step.name,

      enabled: true,

      status: "pending",

      type: step.stepTypeName,

      stepTypeName: step.stepTypeName,

      typeName: step.stepTypeName,

      fullName: step.stepTypeName,

      className: step.stepTypeName,

      properties: Object.entries(step.properties || {}).map(([key, value]) => {
        let propertyValue: string | number | boolean;

        if (typeof value === "boolean") {
          propertyValue = value;
        } else if (typeof value === "number") {
          propertyValue = value;
        } else {
          propertyValue = value == null ? "" : String(value);
        }

        return {
          key,
          label: key,
          type:
            typeof propertyValue === "boolean"
              ? "boolean"
              : typeof propertyValue === "number"
                ? "number"
                : "string",
          value: propertyValue,
          group: "Properties",
          isEditable: true,
        };
      }),
      children: (step.children || []).map(convertImportedStep),
    };
  };
  const importPlan = (json: any) => {
    if (!json.testplan) return;

    const tp = json.testplan;

    setPlanMeta({
      name: tp.name,
      description: tp.description,
      author: tp.author,
      version: tp.version,
      dutName: "",
      dutSerial: "",
      dutModel: "",
      dutFirmware: "",
    });

    const importedSteps = tp.steps.map(convertImportedStep);

    setPlan(importedSteps);
    setExpanded(collectExpandedIds(importedSteps));

    if (importedSteps.length > 0) {
      setSelectedId(importedSteps[0].id);
    }

    setHasPlan(true);
    setSavedPlanSignature(null);
    setIsSaved(false);
    addLog("INFO", "TestPlans", "Plan imported successfully.");
  };
  const handleImportPlan = () => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const json = JSON.parse(text);

      importPlan(json);
    };

    input.click();
  };

  const handleSeqDrop = (event: DragEvent, parentId: string | null, idx: number) => {
    event.preventDefault();
    if (!dragLibItem) return;
    handleAddStep(dragLibItem, parentId, idx, false);
    setDragLibItem(null);
    setDropIdx(null);
  };

  return {
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
    logs,
    consoleFilter,
    setConsoleFilter,
    library,
    libSearch,
    setLibSearch,
    data,
    hasPlan,
    setShowNewPlan,
    showSystemKpis,
    setShowSystemKpis,
    handleAddStep,
    plugins,
    installedPlugins,
    isInstalledPluginsFetching,
    isAvailablePackagesFetching,
    installedSearch,
    setInstalledSearch,
    browseSearch,
    setBrowseSearch,
    handleInstallPlugin,
    handleUninstallPlugin,
    handleUninstallPackage,
    setShowPluginMgr,
    instruments: instruments ?? [],
    isInstrumentsLoading,
    isInstrumentsError,
    duts: duts ?? [],
    connections: connections ?? [],
    resultListeners: resultListeners ?? [],
    traceListeners: traceListeners ?? [],
    isDutsLoading,
    isDutsError,
    isConnectionsLoading,
    isConnectionsError,
    isResultListenersLoading,
    isResultListenersError,
    isTraceListenersLoading,
    isTraceListenersError,
    plan,
    planMeta,
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
    isSaved,
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
  };
}