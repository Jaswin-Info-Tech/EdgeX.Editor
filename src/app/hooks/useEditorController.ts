import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "sonner";
import { useDragResize } from "../components/editor/resizable";
import type { CtxMenu, LibraryItem, LogEntry, PlanMeta, Plugin, RunState, StepStatus, TestStep } from "../types/editor";
import { addToParent, deleteIn, ensureUniqueStepIds, flatAll, makeSequence, makeStep, moveIn, nowTs, parseFreq, resetAll, setStatusIn, setStepEnabled, uid, updateIn, toArray } from "../utils/editor";
import { removePlugin, uploadPlugin } from "../api/plugin";
import { installPackage, uninstallPackage } from "../api/package";
import { useAvailablePackages } from "./usePackage";
import { useMqttResultListener } from "./useMqttResultListener";
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
import {
  cancelRun,
  getRunLogs,
  getRunLogsStreamUrl,
  getRunStatus,
  pauseRun,
  resumeRun,
} from "../api/plugin";

import { composeTestPlan,getStepSchema,runTestPlan } from "../api/testplans";

const PLAN_SNAPSHOT_STORAGE_KEY = "edgex.editor.planSnapshot.v1";
const THEME_STORAGE_KEY = "edgex.editor.theme";
const DEFAULT_TEST_PLAN_ROOT = "D:\\plans";

type StepRunUpdate = {
  ids: string[];
  names: string[];
  paths: string[];
  status: StepStatus;
};

const getStepRunStatus = (record: Record<string, any>): StepStatus | null => {
  const verdict = record.verdict ?? record.Verdict ?? record.stepVerdict ?? record.StepVerdict ?? record.result;
  const verdictText = String(verdict ?? "").trim().toLowerCase();
  const statusText = [record.status, record.state, record.eventType, record.type, record.phase, record.level, record.severity, record.message]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (verdictText === "10" || verdictText === "pass" || verdictText === "passed") return "passed";
  if (verdictText === "30" || verdictText === "fail" || verdictText === "failed") return "failed";
  if (verdictText === "40" || verdictText === "aborted" || verdictText === "abort") return "error";
  if (verdictText === "50" || verdictText === "error") return "error";
  if (statusText.includes("skip")) return "skipped";
  if (statusText.includes("error") || statusText.includes("abort")) return "error";
  if (statusText.includes("fail")) return "failed";
  if (statusText.includes("pass") || statusText.includes("complete") || statusText.includes("finish")) return "passed";
  if (statusText.includes("start") || statusText.includes("running") || statusText.includes("execut")) return "running";
  return null;
};

const collectStepRunUpdates = (payload: unknown): StepRunUpdate[] => {
  const updates: StepRunUpdate[] = [];
  const visited = new Set<object>();

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object" || visited.has(value as object)) return;
    visited.add(value as object);

    const record = value as Record<string, any>;
    const status = getStepRunStatus(record);
    const ids = [record.stepId, record.StepId, record.testStepId, record.TestStepId, record.testStepRunId]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    const names = [record.stepName, record.StepName, record.testStepName, record.TestStepName, record.name, record.Name, record.source]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    const paths = [record.stepPath, record.StepPath, record.testStepPath, record.path, record.Path]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);

    if (status && (ids.length > 0 || names.length > 0 || paths.length > 0)) {
      updates.push({ ids, names, paths, status });
    }

    [record.steps, record.stepResults, record.testSteps, record.results, record.entries, record.items, record.data]
      .forEach(visit);
  };

  visit(payload);
  return updates;
};

type PersistedPlanSnapshot = {
  hasPlan: boolean;
  plan: TestStep[];
  planMeta: PlanMeta;
  selectedId: string | null;
  expandedIds: string[];
  leftTab: "plan" | "library" | "plugins" | "instruments";
  savedPlanSignature: string | null;
  outputPath: string | null;
};

const joinOutputPath = (folderPath: string, planName: string) => {
  const separator = folderPath.includes("/") && !folderPath.includes("\\") ? "/" : "\\";
  const normalizedFolder = folderPath.trim().replace(/[\\/]+$/, "");
  const safeName = (planName || "Untitled Test Plan").trim() || "Untitled Test Plan";
  const normalizedName = safeName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
  return `${normalizedFolder}${separator}${normalizedName}.TapPlan`;
};




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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  });
  const [isSaved, setIsSaved] = useState(false);
  const [savedPlanSignature, setSavedPlanSignature] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [showSaveDestination, setShowSaveDestination] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [mqttCaptureEnabled, setMqttCaptureEnabled] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [leftW, setLeftW] = useState(isDesktop ? 265 : 200);
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
  const saveDestinationResolver = useRef<((value: string | null) => void) | null>(null);
  const lastPolledRunPhaseRef = useRef<"running" | "paused" | "completed" | null>(null);
  const runStatusPollingDisabledRef = useRef(false);
  const seenRunLogKeysRef = useRef<Set<string>>(new Set());
  const runLogsPollingDisabledRef = useRef(false);
  const runLogsPollingErrorNotifiedRef = useRef(false);
  const runLogsStreamErrorNotifiedRef = useRef(false);
  const runLogsClosedNotifiedRef = useRef(false);
  const mqttSubscribedRef = useRef(false);
  const bufferMqttResultsRef = useRef(false);
  const bufferedMqttResultLinesRef = useRef<string[]>([]);
  const canonicalTypeNameCacheRef = useRef<Map<string, string>>(new Map());

  const resolveCanonicalStepTypeName = (stepLike: any): string => {
    const candidates = [
      stepLike?.fullName,
      stepLike?.typeName,
      stepLike?.className,
      stepLike?.stepTypeName,
      stepLike?.type,
      stepLike?.name,
    ];

    const resolved = candidates
      .map((value) => String(value ?? "").trim())
      .find(Boolean);

    return resolved || "unknown";
  };

  const getSchemaRecords = (response: any) => {
    if (Array.isArray(response?.schemas)) return response.schemas;
    if (Array.isArray(response)) return response;
    if (response?.properties) return [response];
    return [];
  };

  const resolveCanonicalTypeFromSchema = async (stepTypeName: string): Promise<string> => {
    const requested = String(stepTypeName ?? "").trim();
    if (!requested) return requested;

    const cached = canonicalTypeNameCacheRef.current.get(requested);
    if (cached) return cached;

    try {
      const schema = await getStepSchema(requested);
      const records = getSchemaRecords(schema);
      const fullName = String(records?.[0]?.fullName ?? "").trim();
      const resolved = fullName || requested;
      canonicalTypeNameCacheRef.current.set(requested, resolved);
      canonicalTypeNameCacheRef.current.set(resolved, resolved);
      return resolved;
    } catch {
      canonicalTypeNameCacheRef.current.set(requested, requested);
      return requested;
    }
  };

  const normalizeFormattedStepTypeNames = async (step: any): Promise<any> => {
    const requestedTypeName = String(step?.stepTypeName ?? "").trim();
    const resolvedTypeName = requestedTypeName
      ? await resolveCanonicalTypeFromSchema(requestedTypeName)
      : requestedTypeName;

    const normalizedChildren = Array.isArray(step?.children) && step.children.length > 0
      ? await Promise.all(step.children.map((child: any) => normalizeFormattedStepTypeNames(child)))
      : undefined;

    return {
      ...step,
      stepTypeName: resolvedTypeName,
      ...(normalizedChildren ? { children: normalizedChildren } : {}),
    };
  };

  const hydrateAddedStepTypeName = async (stepId: string, initialTypeName: string) => {
    const requested = String(initialTypeName ?? "").trim();
    if (!requested || requested === "unknown") return;

    const resolved = await resolveCanonicalTypeFromSchema(requested);
    if (!resolved) return;

    setPlan((prev) =>
      updateIn(prev, stepId, (step) => ({
        ...step,
        stepTypeName: resolved,
        typeName: resolved,
        fullName: resolved,
        className: resolved,
      })),
    );
  };

  const formatStepForSave = useCallback((step: TestStep): any => {
    const runtimePropertyNames = new Set([
      "childteststeps",
      "enabledchildsteps",
      "parent",
      "results",
      "planrun",
      "steprun",
      "rules",
      "error",
    ]);

    const props = (step.properties || []).reduce((acc: Record<string, any>, prop: any) => {
      const schemaKey = String(prop.key ?? "").split("||")[0].trim();
      const propertyName = String(
        prop.backendName ??
        (prop.group === "Schema Properties" ? prop.label : schemaKey || prop.label) ??
        "",
      ).trim();
      if (!propertyName) return acc;
      if (runtimePropertyNames.has(propertyName.toLowerCase())) return acc;

      const isUnchangedLoadedValue =
        Object.prototype.hasOwnProperty.call(prop, "backendValue") &&
        Object.is(prop.value, prop.loadedDisplayValue);
      acc[propertyName] = isUnchangedLoadedValue ? prop.backendValue : prop.value;
      return acc;
    }, {});

    // The tree toggle is authoritative. Keeping this synchronized is especially
    // important for nested steps because OpenTAP evaluates Enabled on each child.
    props.Enabled = step.enabled !== false;

    const stepTypeName = resolveCanonicalStepTypeName(step);

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

  const buildSaveSignature = useCallback((steps: TestStep[], meta: PlanMeta, targetOutputPath: string | null) => {
    return JSON.stringify({
      outputPath: targetOutputPath ?? joinOutputPath(DEFAULT_TEST_PLAN_ROOT, meta.name),
      overwrite: true,
      steps: steps.map(formatStepForSave),
    });
  }, [formatStepForSave]);

  const currentSaveSignature = useMemo(
    () => buildSaveSignature(plan, planMeta, outputPath),
    [buildSaveSignature, outputPath, plan, planMeta],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { renameRef.current?.focus(); }, [renaming]);
  useEffect(() => {
    setPlan((currentPlan) => {
      const result = ensureUniqueStepIds(currentPlan);
      return result.changed ? result.steps : currentPlan;
    });
  }, [plan]);
  useEffect(() => {
    try {
      const rawSnapshot = localStorage.getItem(PLAN_SNAPSHOT_STORAGE_KEY);
      if (!rawSnapshot) return;

      const parsed = JSON.parse(rawSnapshot) as Partial<PersistedPlanSnapshot>;
      if (!parsed || parsed.hasPlan !== true || !Array.isArray(parsed.plan)) return;

      const restoredPlan = parsed.plan;
      const restoredMeta = parsed.planMeta;
      if (!restoredMeta || typeof restoredMeta !== "object") return;

      setPlan(restoredPlan);
      setPlanMeta({
        name: String(restoredMeta.name ?? "Untitled Test Plan"),
        description: String(restoredMeta.description ?? ""),
        author: String(restoredMeta.author ?? ""),
        version: String(restoredMeta.version ?? "1.0.0"),
        dutName: String(restoredMeta.dutName ?? ""),
        dutSerial: String(restoredMeta.dutSerial ?? ""),
        dutModel: String(restoredMeta.dutModel ?? ""),
        dutFirmware: String(restoredMeta.dutFirmware ?? ""),
      });
      setHasPlan(true);

      const validIds = new Set(flatAll(restoredPlan).map((step) => step.id));
      const restoredSelectedId = String(parsed.selectedId ?? "");
      setSelectedId(restoredSelectedId && validIds.has(restoredSelectedId) ? restoredSelectedId : null);

      const expandedIds = Array.isArray(parsed.expandedIds)
        ? parsed.expandedIds.filter((id): id is string => typeof id === "string" && validIds.has(id))
        : [];
      setExpanded(new Set(expandedIds));

      const restoredLeftTab = parsed.leftTab;
      if (restoredLeftTab === "plan" || restoredLeftTab === "library" || restoredLeftTab === "plugins" || restoredLeftTab === "instruments") {
        setLeftTab(restoredLeftTab);
      }

      setOutputPath(typeof parsed.outputPath === "string" && parsed.outputPath.trim() ? parsed.outputPath : null);
      setSavedPlanSignature(typeof parsed.savedPlanSignature === "string" ? parsed.savedPlanSignature : null);
      setRunState("idle");
      setActiveRunId(null);
      setLogs((prev) => [
        ...prev,
        {
          id: logId.current++,
          timestamp: nowTs(),
          level: "INFO",
          source: "TestPlans",
          message: "Restored previous plan from browser session.",
        },
      ]);
    } catch {
      // Ignore restore failures and fall back to default empty state.
    }
  }, []);
  useEffect(() => {
    if (!hasPlan || !savedPlanSignature) {
      setIsSaved(false);
      return;
    }
    setIsSaved(currentSaveSignature === savedPlanSignature);
  }, [currentSaveSignature, hasPlan, savedPlanSignature]);
  useEffect(() => {
    try {
      if (!hasPlan) {
        localStorage.removeItem(PLAN_SNAPSHOT_STORAGE_KEY);
        return;
      }

      const snapshot: PersistedPlanSnapshot = {
        hasPlan,
        plan,
        planMeta,
        selectedId,
        expandedIds: Array.from(expanded),
        leftTab,
        savedPlanSignature,
        outputPath,
      };

      localStorage.setItem(PLAN_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore persistence errors (e.g., private mode quota issues).
    }
  }, [expanded, hasPlan, leftTab, outputPath, plan, planMeta, savedPlanSignature, selectedId]);
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

  const applyStepRunUpdates = useCallback((payload: unknown) => {
    const updates = collectStepRunUpdates(payload);
    if (updates.length === 0) return;

    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    setPlan((currentPlan) => {
      let changed = false;

      const applyToStep = (step: TestStep): TestStep => {
        let nextStatus = step.status;
        for (const update of updates) {
          const idMatch = update.ids.length > 0 && update.ids.some((id) => normalize(id) === normalize(step.id));
          const pathMatch = update.ids.length === 0 && update.paths.length > 0 && update.paths.some(
            (path) => normalize(path) === normalize(step.description),
          );
          const stepNames = [step.name, step.stepTypeName, step.typeName, step.fullName, step.className]
            .map(normalize)
            .filter(Boolean);
          const nameMatch = update.ids.length === 0 && update.paths.length === 0 && update.names.some(
            (name) => stepNames.includes(normalize(name)),
          );

          if (idMatch || pathMatch || nameMatch) nextStatus = update.status;
        }

        const children = step.children?.map(applyToStep);
        if (nextStatus !== step.status || children?.some((child, index) => child !== step.children?.[index])) {
          changed = true;
          return { ...step, status: nextStatus, children };
        }
        return step;
      };

      const nextPlan = currentPlan.map(applyToStep);
      return changed ? nextPlan : currentPlan;
    });
  }, []);

  const formatMqttResultMessage = (data: any): string[] => {
    if (!data || typeof data !== "object" || data.type !== "result-table") {
      return [typeof data === "string" ? data : JSON.stringify(data)];
    }

    const columns = Array.isArray(data.columns) ? data.columns : [];

    const lines: string[] = [];
    columns.forEach((col: any) => {
      const values = Array.isArray(col?.values) ? col.values : [col?.values];

      values.forEach((rawValue: any) => {
        // Try to parse stringified JSON bodies (e.g. REST.Body) for pretty display
        if (typeof rawValue === "string") {
          try {
            const parsed = JSON.parse(rawValue);
            lines.push(JSON.stringify(parsed, null, 2));
            return;
          } catch {
            // not JSON, fall through to plain display
          }
        }
      });
    });

    return lines;
  };

  const mqttListener = useMqttResultListener(
    (topic, data) => {
      applyStepRunUpdates(data);
      const lines = formatMqttResultMessage(data);
      if (bufferMqttResultsRef.current) {
        bufferedMqttResultLinesRef.current.push(...lines);
        return;
      }
      lines.forEach((line) => addLog("INFO", "MQTT", line));
    },
    (level, message) => {
      addLog(level, "MQTT", message);
    },
    { enabled: mqttCaptureEnabled || (Boolean(activeRunId) && (runState === "running" || runState === "paused")) },
  );

  useEffect(() => {
    mqttSubscribedRef.current = mqttListener.isSubscribed;
  }, [mqttListener.isSubscribed]);

  const waitForMqttSubscription = useCallback(async (timeoutMs = 1500) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (mqttSubscribedRef.current) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }, []);

  const wait = useCallback(
    (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs)),
    [],
  );

  const flushBufferedMqttResults = useCallback(() => {
    const lines = bufferedMqttResultLinesRef.current;
    bufferedMqttResultLinesRef.current = [];
    lines.forEach((line) => addLog("INFO", "MQTT", line));
  }, [addLog]);

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
    const baseURL = String(requestConfig?.baseURL ?? "");
    const resolvedUrl = /^https?:\/\//i.test(url)
      ? url
      : baseURL
        ? `${baseURL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
        : url;
    const status = responseObj?.status;
    const statusText = responseObj?.statusText;

    lines.push(`Request: ${method} ${resolvedUrl}`);
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

  useEffect(() => {
    if (!activeRunId) {
      seenRunLogKeysRef.current.clear();
      runLogsPollingErrorNotifiedRef.current = false;
      runLogsStreamErrorNotifiedRef.current = false;
      runLogsClosedNotifiedRef.current = false;
      return;
    }

    if (runState !== "running" && runState !== "paused") return;

    let cancelled = false;
    let pollIntervalId: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;
    let usingPolling = false;

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

    const mapLogLevel = (value: unknown): LogEntry["level"] => {
      const text = String(value ?? "").trim().toUpperCase();
      if (text === "PASS") return "PASS";
      if (text === "FAIL") return "FAIL";
      if (text === "WARN" || text === "WARNING") return "WARN";
      if (text === "ERROR" || text === "ERR" || text === "FATAL") return "ERROR";
      if (text === "DEBUG" || text === "TRACE") return "DEBUG";
      return "INFO";
    };

    const extractLogEntries = (payload: unknown): unknown[] => {
      const entries: unknown[] = [];
      const visited = new Set<object>();
      const collectionKeys = [
        "logs", "Logs", "entries", "Entries", "items", "Items", "data", "Data",
        "events", "Events", "logEntries", "LogEntries", "stepLogs", "StepLogs", "runLogs", "RunLogs",
        "steps", "Steps", "stepResults", "StepResults", "results", "Results",
      ];

      const visit = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }

        const record = asRecord(value);
        if (!record) {
          if (value != null) entries.push(value);
          return;
        }
        if (visited.has(record)) return;
        visited.add(record);

        const collections = collectionKeys
          .map((key) => record[key])
          .filter((collection) => Array.isArray(collection) || asRecord(collection));

        collections.forEach(visit);

        // A step status wrapper often contains nested logs but no message of its own.
        // Preserve records that do carry a message, and retain unknown event shapes as
        // JSON so that no backend log event is silently lost.
        const hasMessage = ["message", "Message", "text", "Text", "line", "Line", "log", "Log"]
          .some((key) => record[key] != null && stringify(record[key]) !== "");
        if (hasMessage || collections.length === 0) entries.push(record);
      };

      visit(payload);
      return entries;
    };

    const appendEntries = (payload: unknown, deduplicate = true) => {
      const entries = extractLogEntries(payload);
      if (entries.length === 0) return;

      const nextLogs: LogEntry[] = [];

      entries.forEach((entry: any) => {
        const rec = asRecord(entry);
        applyStepRunUpdates(rec ?? entry);
        const message = rec
          ? stringify(rec.message ?? rec.Message ?? rec.text ?? rec.Text ?? rec.line ?? rec.Line ?? rec.log ?? rec.Log)
            || stringify(rec)
          : stringify(entry);
        if (!message) return;

        const source = rec
          ? stringify(rec.source ?? rec.Source ?? rec.logger ?? rec.Logger ?? rec.category ?? rec.Category ?? rec.component ?? rec.Component)
          : "Run";
        const level = rec
          ? mapLogLevel(rec.level ?? rec.Level ?? rec.severity ?? rec.Severity ?? rec.type ?? rec.Type)
          : "INFO";
        const externalId = rec
          ? stringify(rec.id ?? rec.Id ?? rec.sequence ?? rec.Sequence ?? rec.index ?? rec.Index)
          : "";
        const eventTime = rec
          ? stringify(rec.timestamp ?? rec.Timestamp ?? rec.timestampUtc ?? rec.TimestampUtc ?? rec.createdAt ?? rec.CreatedAt)
          : "";
        const key = externalId || (eventTime ? `${eventTime}|${source}|${level}|${message}` : `${source}|${level}|${message}`);

        if (deduplicate) {
          if (seenRunLogKeysRef.current.has(key)) return;
          seenRunLogKeysRef.current.add(key);
        }

        nextLogs.push({
          id: logId.current++,
          timestamp: nowTs(),
          level,
          source: source || "Run",
          message,
        });
      });

      if (nextLogs.length > 0) {
        setLogs((prev) => [...prev, ...nextLogs]);
        runLogsPollingErrorNotifiedRef.current = false;
      }
    };

    const markRunLogsClosed = (reason: string) => {
      setRunState("completed");
      setActiveRunId(null);
      if (!runLogsClosedNotifiedRef.current) {
        addLog("INFO", "EdgeX", `Run ${activeRunId} completed or expired [${reason}].`);
        runLogsClosedNotifiedRef.current = true;
      }
    };

    const ingestLogs = async () => {
      try {
        const payload = await getRunLogs(activeRunId);
        if (cancelled) return;
        appendEntries(payload);
      } catch (error) {
        if (cancelled) return;

        const responseObj = asRecord(asRecord(error)?.response);
        const statusCode = Number(responseObj?.status ?? 0);
        const body = asRecord(responseObj?.data);
        const message = String(body?.message ?? "").toLowerCase();

        if (statusCode === 404 && message.includes("run not found")) {
          markRunLogsClosed("log sync");
          return;
        }

        if (statusCode === 404 || statusCode === 405) {
          runLogsPollingDisabledRef.current = true;
          if (!runLogsPollingErrorNotifiedRef.current) {
            addLog("WARN", "EdgeX", "Run logs polling disabled (logs endpoint unavailable).");
            runLogsPollingErrorNotifiedRef.current = true;
          }
          return;
        }

        if (!runLogsPollingErrorNotifiedRef.current) {
          addLog("WARN", "EdgeX", "Unable to fetch live run logs; retrying...");
          runLogsPollingErrorNotifiedRef.current = true;
        }
      }
    };

    const startPolling = () => {
      if (usingPolling || runLogsPollingDisabledRef.current) return;
      usingPolling = true;
      ingestLogs();
      pollIntervalId = setInterval(ingestLogs, 1500);
    };

    const startStream = () => {
      const streamUrl = getRunLogsStreamUrl(activeRunId);
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        if (cancelled) return;
        if (!event.data) return;
        try {
          // Stream events are already individual deliveries. Do not collapse identical
          // messages: repeated step output is still meaningful output.
          appendEntries(JSON.parse(event.data), false);
        } catch {
          appendEntries({ message: event.data, source: "RunStream", level: "INFO" }, false);
        }
      };

      eventSource.onerror = async () => {
        if (cancelled) return;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        try {
          const statusPayload = await getRunStatus(activeRunId);
          if (cancelled) return;

          const statusRecord = asRecord(statusPayload) ?? {};
          const statusText = String(statusRecord.status ?? statusRecord.state ?? statusRecord.runState ?? "").toLowerCase();
          const completedFlag =
            statusRecord.completed === true ||
            statusRecord.isCompleted === true ||
            statusRecord.finished === true ||
            statusRecord.ended === true ||
            statusRecord.succeeded === true;

          if (
            completedFlag ||
            statusText.includes("completed") ||
            statusText.includes("finished") ||
            statusText.includes("stopped") ||
            statusText.includes("cancel") ||
            statusText.includes("aborted") ||
            statusText.includes("failed") ||
            statusText.includes("error")
          ) {
            markRunLogsClosed("stream status sync");
            return;
          }
        } catch (statusError) {
          if (cancelled) return;
          const statusResponse = asRecord(asRecord(statusError)?.response);
          const statusCode = Number(statusResponse?.status ?? 0);
          const statusBody = asRecord(statusResponse?.data);
          const statusMessage = String(statusBody?.message ?? "").toLowerCase();
          if (statusCode === 404 && statusMessage.includes("run not found")) {
            markRunLogsClosed("stream status sync");
            return;
          }
        }

        if (!runLogsStreamErrorNotifiedRef.current) {
          addLog("WARN", "EdgeX", "Run logs stream unavailable. Falling back to polling.");
          runLogsStreamErrorNotifiedRef.current = true;
        }
        startPolling();
      };
    };

    startStream();

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [activeRunId, addLog, applyStepRunUpdates, runState]);

  useEffect(() => {
    if ((runState === "completed" || runState === "idle") && activeRunId) {
      setActiveRunId(null);
    }
    if (runState === "completed" || runState === "idle") {
      lastPolledRunPhaseRef.current = null;
    }
  }, [runState, activeRunId]);

  useEffect(() => {
    if (!activeRunId) return;
    if (runStatusPollingDisabledRef.current) return;
    if (runState !== "running" && runState !== "paused") return;

    let cancelled = false;

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

    const getPhase = (payload: Record<string, unknown>) => {
      const statusText = String(payload.status ?? payload.state ?? payload.runState ?? "").toLowerCase();
      const completedFlag =
        payload.completed === true ||
        payload.isCompleted === true ||
        payload.finished === true ||
        payload.ended === true ||
        payload.succeeded === true;

      if (completedFlag) return "completed" as const;
      if (statusText.includes("paused")) return "paused" as const;
      if (
        statusText.includes("completed") ||
        statusText.includes("finished") ||
        statusText.includes("stopped") ||
        statusText.includes("cancel") ||
        statusText.includes("aborted") ||
        statusText.includes("failed") ||
        statusText.includes("error")
      ) {
        return "completed" as const;
      }

      return "running" as const;
    };

    const pollStatus = async () => {
      if (cancelled) return;
      if (runState !== "running" && runState !== "paused") return;
      try {
        const response = await getRunStatus(activeRunId);
        if (cancelled) return;

        const payload = asRecord(response) ?? {};
        applyStepRunUpdates(payload);
        const phase = getPhase(payload);
        const previous = lastPolledRunPhaseRef.current;
        if (phase !== previous) {
          lastPolledRunPhaseRef.current = phase;
          if (phase === "paused") {
            setRunState("paused");
            addLog("WARN", "EdgeX", `Run paused (${activeRunId}) [status sync].`);
          } else if (phase === "running") {
            setRunState("running");
          } else {
            const duration = stringify(payload.duration ?? payload.durationMs ?? "-");
            const verdict = stringify(payload.verdict ?? payload.result ?? payload.status ?? "completed");
            setRunState("completed");
            setActiveRunId(null);
            addLog("INFO", "EdgeX", `Run completed [status sync]: verdict=${verdict} | duration=${duration}`);
          }
        }
      } catch (error) {
        if (cancelled) return;

        const responseObj = asRecord(asRecord(error)?.response);
        const statusCode = Number(responseObj?.status ?? 0);
        const payload = asRecord(responseObj?.data);
        const message = String(payload?.message ?? "").toLowerCase();

        if (statusCode === 404 && message.includes("run not found")) {
          setRunState("completed");
          setActiveRunId(null);
          addLog("INFO", "EdgeX", `Run ${activeRunId} completed or expired [status sync].`);
          return;
        }

        if (statusCode === 404 || statusCode === 405) {
          runStatusPollingDisabledRef.current = true;
          addLog("WARN", "EdgeX", "Run status polling disabled (status endpoint unavailable).");
          return;
        }
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeRunId, addLog, applyStepRunUpdates, runState]);

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
    setActiveRunId(null);
    setLogs([]);
    setHasPlan(true);
    setSavedPlanSignature(null);
    setOutputPath(null);
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

    const initialTypeName = resolveCanonicalStepTypeName(step);
    void hydrateAddedStepTypeName(step.id, initialTypeName);
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
      setPlan(prev => updateIn(prev, stepId, item => setStepEnabled(item, !item.enabled)));
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
      const nextName = renameVal.trim();
      setPlan(prev => updateIn(prev, renaming, step => ({
        ...step,
        name: nextName,
        properties: step.properties.map(prop => {
          const isNameProperty =
            String(prop.key ?? "").trim().toLowerCase() === "name" ||
            String(prop.label ?? "").trim().toLowerCase() === "name" ||
            String(prop.key ?? "").trim().toLowerCase().startsWith("name ||");

          return isNameProperty ? { ...prop, value: nextName } : prop;
        }),
      })));
    }
    setRenaming(null);
  };

  const updateProperty = (stepId: string, key: string, raw: string) => {
    setPlan(prev => updateIn(prev, stepId, step => {
      let shouldRenameStep = false;
      let nextEnabled = step.enabled;

      const properties = step.properties.map(prop => {
        if (prop.key !== key) return prop;
        if (prop.isEditable === false) return prop;

        const propertyName = String(
          prop.backendName ||
          prop.label ||
          String(prop.key ?? "").split("||")[0],
        ).trim().toLowerCase();
        shouldRenameStep = propertyName === "name";

        if (propertyName === "enabled") {
          nextEnabled = raw === "true";
        }

        if (prop.type === "number") return { ...prop, value: parseFloat(raw) || 0 };
        if (prop.type === "boolean") return { ...prop, value: raw === "true" };
        if (prop.type === "frequency") return { ...prop, value: parseFreq(raw) };
        return { ...prop, value: raw };
      });

      return {
        ...step,
        ...(shouldRenameStep && raw.trim() ? { name: raw.trim() } : {}),
        enabled: nextEnabled,
        properties,
      };
    }));
  };

  const getDefaultOutputPath = useCallback(
    () => joinOutputPath(DEFAULT_TEST_PLAN_ROOT, planMeta.name),
    [planMeta.name],
  );

  const requestSaveDestination = useCallback(() => {
    if (outputPath) return Promise.resolve(outputPath);

    setShowSaveDestination(true);
    return new Promise<string | null>((resolve) => {
      saveDestinationResolver.current = resolve;
    });
  }, [outputPath]);

  const handleConfirmSaveDestination = (destinationPath: string) => {
    const selectedOutputPath = destinationPath.trim() || getDefaultOutputPath();
    saveDestinationResolver.current?.(selectedOutputPath);
    saveDestinationResolver.current = null;
    setShowSaveDestination(false);
  };

  const handleCancelSaveDestination = () => {
    saveDestinationResolver.current?.(null);
    saveDestinationResolver.current = null;
    setShowSaveDestination(false);
  };

  const stopMqttCaptureAfter = useCallback((delayMs = 1000) => {
    const timer = setTimeout(() => setMqttCaptureEnabled(false), delayMs);
    runTimers.current.push(timer);
  }, []);

  useEffect(() => {
    if (!mqttCaptureEnabled) return;
    if (activeRunId) return;
    if (runState !== "idle" && runState !== "completed") return;
    stopMqttCaptureAfter();
  }, [activeRunId, mqttCaptureEnabled, runState, stopMqttCaptureAfter]);

  const handleRun = async () => {
    if (runState === "running" || plan.length === 0 || !isSaved) return;
    runTimers.current.forEach(clearTimeout);
    setPlan(resetAll);
    setLogs([]);
    setRunState("running");
    setActiveRunId(null);
    setMqttCaptureEnabled(true);
    bufferMqttResultsRef.current = true;
    bufferedMqttResultLinesRef.current = [];
    setShowConsole(true);

    const runPath = outputPath ?? getDefaultOutputPath();
    addLog("INFO", "EdgeX", `=== Run started - "${planMeta.name}" ===`);
    addLog("INFO", "TestPlans", `Run request: ${runPath}`);

    try {
      await waitForMqttSubscription();
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
      applyStepRunUpdates(payload);
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
      const hasRunId = runId !== "-" && runId.trim() !== "";
      const statusText = String(payload?.status ?? payload?.state ?? payload?.runState ?? "").toLowerCase();
      const hasExplicitActiveState =
        statusText.includes("running") ||
        statusText.includes("started") ||
        statusText.includes("queued") ||
        statusText.includes("paused");
      const hasExplicitCompleteState =
        payload?.completed === true ||
        payload?.isCompleted === true ||
        payload?.finished === true ||
        payload?.ended === true ||
        statusText.includes("completed") ||
        statusText.includes("finished") ||
        statusText.includes("stopped") ||
        statusText.includes("cancel") ||
        statusText.includes("aborted") ||
        statusText.includes("failed") ||
        statusText.includes("error");
      const hasCompletedDuration =
        duration !== "-" &&
        duration.trim() !== "" &&
        !/^0+(?::0+)*(\.0+)?$/.test(duration.trim());
      const isNotSetVerdict = verdict.toLowerCase() === "notset";
      const shouldTrackAsActive =
        !failedToStart &&
        hasRunId &&
        !hasExplicitCompleteState &&
        (hasExplicitActiveState || (isNotSetVerdict && !hasCompletedDuration));

      if (shouldTrackAsActive) {
        setActiveRunId(runId);
      }

      addLog("INFO", "EdgeX", `Run summary: id=${runId} | verdict=${verdict} | duration=${duration}`);
      if (!shouldTrackAsActive) {
        await wait(350);
      }
      bufferMqttResultsRef.current = false;
      flushBufferedMqttResults();

      if (failedToStart) {
        addLog("ERROR", "EdgeX", "=== Run complete - Failed to start ===");
        setRunState("idle");
        setActiveRunId(null);
        stopMqttCaptureAfter();
      } else if (shouldTrackAsActive) {
        addLog("INFO", "EdgeX", "Run is active. Use Pause/Resume/Stop controls.");
        setRunState("running");
      } else {
        addLog("INFO", "EdgeX", `=== Run complete - verdict=${verdict} ===`);
        setRunState("completed");
        setActiveRunId(null);
        stopMqttCaptureAfter();
      }
    } catch (error) {
      bufferMqttResultsRef.current = false;
      flushBufferedMqttResults();
      setShowConsole(true);
      addLog("ERROR", "TestPlans", "Failed to start test plan run.");
      logApiErrorDetails("TestPlans", error, { method: "POST", url: "testplans/run" });
      setRunState("idle");
      setActiveRunId(null);
      stopMqttCaptureAfter(0);
    }
  };

  const handleStop = async () => {
    runTimers.current.forEach(clearTimeout);
    if (!activeRunId || (runState !== "running" && runState !== "paused")) {
      bufferMqttResultsRef.current = false;
      bufferedMqttResultLinesRef.current = [];
      setRunState("idle");
      setActiveRunId(null);
      setMqttCaptureEnabled(false);
      addLog("WARN", "EdgeX", "Run aborted by user.");
      return;
    }

    try {
      const response = await cancelRun(activeRunId);
      setShowConsole(true);
      addLog("WARN", "EdgeX", `Cancelling run ${activeRunId}...`);
      logApiSuccessDetails("TestPlans", "Cancel", response);
      bufferMqttResultsRef.current = false;
      bufferedMqttResultLinesRef.current = [];
      setRunState("idle");
      setActiveRunId(null);
      setMqttCaptureEnabled(false);
      addLog("WARN", "EdgeX", "Run cancelled.");
    } catch (error) {
      setShowConsole(true);
      const asRecord = (value: unknown): Record<string, unknown> | null => {
        if (value && typeof value === "object") return value as Record<string, unknown>;
        return null;
      };
      const responseObj = asRecord(asRecord(error)?.response);
      const status = responseObj?.status;
      const payload = asRecord(responseObj?.data);
      const message = String(payload?.message ?? "").toLowerCase();

      if (status === 404 && message.includes("run not found")) {
        addLog("WARN", "EdgeX", `Run ${activeRunId} is no longer active (already completed/expired).`);
        setRunState("completed");
        setActiveRunId(null);
        stopMqttCaptureAfter();
        return;
      }

      addLog("ERROR", "EdgeX", `Unable to cancel run ${activeRunId}.`);
      logApiErrorDetails("TestPlans", error, { method: "POST", url: `runs/${activeRunId}/cancel` });
    }
  };

  const handlePause = async () => {
    if (!activeRunId) {
      addLog("WARN", "EdgeX", "No active run to pause or resume.");
      return;
    }

    if (runState === "running") {
      try {
        const response = await pauseRun(activeRunId);
        setShowConsole(true);
        logApiSuccessDetails("TestPlans", "Pause", response);
        setRunState("paused");
        addLog("WARN", "EdgeX", `Run paused (${activeRunId}).`);
      } catch (error) {
        setShowConsole(true);
        const asRecord = (value: unknown): Record<string, unknown> | null => {
          if (value && typeof value === "object") return value as Record<string, unknown>;
          return null;
        };
        const responseObj = asRecord(asRecord(error)?.response);
        const status = responseObj?.status;
        const payload = asRecord(responseObj?.data);
        const message = String(payload?.message ?? "").toLowerCase();

        if (status === 404 && message.includes("run not found")) {
          addLog("WARN", "EdgeX", `Run ${activeRunId} is no longer active (already completed/expired).`);
          setRunState("completed");
          setActiveRunId(null);
          stopMqttCaptureAfter();
          return;
        }

        addLog("ERROR", "EdgeX", `Unable to pause run ${activeRunId}.`);
        logApiErrorDetails("TestPlans", error, { method: "POST", url: `runs/${activeRunId}/pause` });
      }
    } else if (runState === "paused") {
      try {
        const response = await resumeRun(activeRunId);
        setShowConsole(true);
        logApiSuccessDetails("TestPlans", "Resume", response);
        setRunState("running");
        addLog("INFO", "EdgeX", `Run resumed (${activeRunId}).`);
      } catch (error) {
        setShowConsole(true);
        const asRecord = (value: unknown): Record<string, unknown> | null => {
          if (value && typeof value === "object") return value as Record<string, unknown>;
          return null;
        };
        const responseObj = asRecord(asRecord(error)?.response);
        const status = responseObj?.status;
        const payload = asRecord(responseObj?.data);
        const message = String(payload?.message ?? "").toLowerCase();

        if (status === 404 && message.includes("run not found")) {
          addLog("WARN", "EdgeX", `Run ${activeRunId} is no longer active (already completed/expired).`);
          setRunState("completed");
          setActiveRunId(null);
          stopMqttCaptureAfter();
          return;
        }

        addLog("ERROR", "EdgeX", `Unable to resume run ${activeRunId}.`);
        logApiErrorDetails("TestPlans", error, { method: "POST", url: `runs/${activeRunId}/resume` });
      }
    }
  };

  const handleReset = () => {
    runTimers.current.forEach(clearTimeout);
    bufferMqttResultsRef.current = false;
    bufferedMqttResultLinesRef.current = [];
    setRunState("idle");
    setActiveRunId(null);
    setMqttCaptureEnabled(false);
    setPlan([]);
    setExpanded(new Set());
    setSelectedId(null);
    setRenaming(null);
    setDraggedStepId(null);
    setAddStepParentId(null);
    setAddStepIdx(undefined);
    setShowAddStep(false);
    setSavedPlanSignature(null);
    setIsSaved(false);
    setLogs([{ id: logId.current++, timestamp: nowTs(), level: "INFO", source: "EdgeX", message: "Sequence cleared. Test plan kept." }]);
  };


  const handleStepReorder = (stepId: string, newParentId: string | null, newIdx: number) => {
    setPlan(prev => moveStepToPosition(prev, stepId, newParentId, newIdx));
    if (newParentId) setExpanded(prev => new Set([...prev, newParentId]));
    setDraggedStepId(null);
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
    if (!plugin) {
      toast.error("Unable to find the selected plugin.");
      return;
    }
    const pluginName = plugin?.name ?? "Plugin";
    const uninstallName = plugin?.uninstallName ?? pluginName;
    const toastId = toast.loading(`Removing ${pluginName}...`);
    try {
      setInstalledPlugins(prev => prev.map(item =>
        item.id === id ? { ...item, state: "uninstalling" } : item
      ));
      await removePlugin({
        pluginName: uninstallName,
        packageName: plugin?.packageName,
        assembly: plugin?.assembly,
      });
      setInstalledPlugins(prev => prev.filter(item => {
        const belongsToRemovedAssembly = Boolean(plugin.assembly) && item.assembly === plugin.assembly;
        return item.id !== id && !belongsToRemovedAssembly;
      }));
      addLog("INFO", "Plugins", `Removed: ${pluginName}`);
      toast.success(`${pluginName} removed successfully`, { id: toastId });

      refreshPluginData();
    } catch (err) {
      setInstalledPlugins(prev => prev.map(item =>
        item.id === id ? { ...item, state: "installed" } : item
      ));
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
    const selectedOutputPath = await requestSaveDestination();
    if (!selectedOutputPath) return null;

    const formattedSteps = plan.map(formatStepForCompose);
    const normalizedSteps = await Promise.all(
      formattedSteps.map((step) => normalizeFormattedStepTypeNames(step)),
    );

    const jsonData = {
      outputPath: selectedOutputPath,
      overwrite: true,
      steps: normalizedSteps,
    };

console.log("Saving test plan to:", jsonData);

    try {
      const response = await composeTestPlan(jsonData);
      addLog("INFO", "TestPlans", `Saved: ${jsonData.outputPath}`);
      setOutputPath(selectedOutputPath);
      setSavedPlanSignature(buildSaveSignature(plan, planMeta, selectedOutputPath));
      setIsSaved(true);
      return response;
    } catch (error) {
      const backendMessage = error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { Message?: string } } }).response?.data?.Message
        : undefined;
      const displayMessage = backendMessage?.replace(/\s*\(Parameter 'Steps'\)\s*$/i, "").trim() || "Unable to save test plan.";

      setShowConsole(true);
      addLog("ERROR", "TestPlans", "Failed to save test plan.");
      logApiErrorDetails("TestPlans", error, { method: "POST", url: "plugins/compose" });
      toast.error(displayMessage);
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
    const stepTypeName = resolveCanonicalStepTypeName(step);

    return {
      id: crypto.randomUUID(),

      name: step.name,

      enabled: true,

      status: "pending",

      type: stepTypeName,

      stepTypeName,

      typeName: String(step.typeName ?? stepTypeName),

      fullName: String(step.fullName ?? stepTypeName),

      className: String(step.className ?? stepTypeName),

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
    setRunState("idle");
    setActiveRunId(null);
    setSavedPlanSignature(null);
    setOutputPath(null);
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
    isSaved,
    setShowConsole,
    logEndRef,
    showNewPlan,
    handleCreatePlan,
    showAddStep,
    showSaveDestination,
    defaultOutputPath: getDefaultOutputPath(),
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
  };
}
