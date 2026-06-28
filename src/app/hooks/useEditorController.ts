import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { toast } from "sonner";
import { useDragResize } from "../components/editor/resizable";
import { BASE_LIBRARY } from "../data/library";
import type { CtxMenu, LibraryItem, LogEntry, PlanMeta, Plugin, RunState, StepStatus, TestStep } from "../types/editor";
import { addToParent, deleteIn, flatAll, makeSequence, makeStep, moveIn, nowTs, parseFreq, resetAll, setStatusIn, uid, updateIn, toArray } from "../utils/editor";
import { removePlugin, uploadPlugin } from "../api/plugin";
import { installPackage, uninstallPackage } from "../api/package";
// import { usePlugins } from "./usePlugin";
import { useAvailablePackages } from "./usePackage";
import { useInstalledPlugins, usePlugins, useInstruments } from "./usePlugin";
import { useWindowWidth } from "./useWindowWidth";


export function useEditorController() {
  const winW = useWindowWidth();
  const isDesktop = winW >= 1280;
  const isTablet = winW >= 768 && winW < 1024;
  const { data: installedPluginsData, refetch: refetchInstalledPlugins } = useInstalledPlugins();
  const { data: availablePackagesData, refetch: refetchAvailablePackages } = useAvailablePackages();
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
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [contextMenu, setContextMenu] = useState<CtxMenu | null>(null);
  const [addStepParentId, setAddStepParentId] = useState<string | null>(null);
  const [addStepIdx, setAddStepIdx] = useState<number | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);

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

  const [dragLibItem, setDragLibItem] = useState<LibraryItem | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const logId = useRef(1);
  const logEndRef = useRef<HTMLDivElement>(null);
  const runTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { renameRef.current?.focus(); }, [renaming]);
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

    const normalizePackagePlugin = (item: any, fallbackInstalled: boolean): Plugin => {
      const statusInstalled = String(item.status ?? "").trim().toLowerCase() === "installed";
      const isInstalled = item.isInstalled === undefined
        ? fallbackInstalled || statusInstalled
        : asBool(item.isInstalled, fallbackInstalled || statusInstalled);
      const name = String(item.name ?? item.packageName ?? item.pluginName ?? "Untitled Plugin");
      return {
        ...item,
        id: String(item.id ?? item.name ?? item.packageName ?? item.pluginName ?? ""),
        name,
        version: String(item.version ?? ""),
        author: String(item.author ?? item.publisher ?? ""),
        description: String(item.description ?? ""),
        state: isInstalled ? "installed" : "available",
        isInstalled,
        uninstallName: String(item.pluginName ?? item.packageName ?? name),
        updateAvailable: asBool(item.updateAvailable),
        status: String(item.status ?? (isInstalled ? "Installed" : "Available")),
        steps: Array.isArray(item.steps) ? item.steps : [],
      };
    };

    const availableCatalog = toArray(availablePackagesData).map((item: any) => normalizePackagePlugin(item, false));
    setPlugins(availableCatalog);
  }, [availablePackagesData]);

  useEffect(() => {
    const normalizeInstalledPlugin = (item: any, index: number): Plugin => {
      const name = String(item.name ?? item.pluginName ?? item.packageName ?? "Untitled Plugin");
      const assembly = String(item.assembly ?? "");
      const baseType = String(item.baseType ?? "");

      return {
        ...item,
        id: String(item.id ?? `${assembly || "plugin"}:${name}:${index}`),
        name,
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
        uninstallName: String(item.pluginName ?? item.packageName ?? item.name ?? name),
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

  const library: LibraryItem[] = [
    ...BASE_LIBRARY,
    ...installedPlugins
      .flatMap(plugin => (plugin.steps ?? []).map(step => ({ ...step, pluginId: plugin.id }))),
    // ...plugins.filter(plugin => plugin.status === "installed").flatMap(plugin => plugin.steps.map(step => ({ ...step, pluginId: plugin.id })) ),
  ];
  const { data } = usePlugins();
  const { data: instruments, isLoading: isInstrumentsLoading, isError: isInstrumentsError } = useInstruments();

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

  const handleAddStep = (item: LibraryItem, parentId?: string | null, atIdx?: number) => {
    const step = makeStep(item);
    const pid = parentId !== undefined ? parentId : addStepParentId;
    const idx = atIdx !== undefined ? atIdx : addStepIdx;
    setPlan(prev => addToParent(prev, pid ?? null, step, idx));
    if (pid) setExpanded(prev => new Set([...prev, pid]));
    setSelectedId(step.id);
    setLeftTab("plan");
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
        if (prop.type === "number") return { ...prop, value: parseFloat(raw) || 0 };
        if (prop.type === "boolean") return { ...prop, value: raw === "true" };
        if (prop.type === "frequency") return { ...prop, value: parseFreq(raw) };
        return { ...prop, value: raw };
      }),
    })));
  };

  const handleRun = () => {
    if (runState === "running" || plan.length === 0) return;
    runTimers.current.forEach(clearTimeout);
    setPlan(resetAll);
    setLogs([]);
    setRunState("running");
    const leaves = flatAll(plan).filter(step => !step.children && step.enabled);
    addLog("INFO", "EdgeX", `=== Run started - "${planMeta.name}" ===`);
    addLog("INFO", "EdgeX", `${leaves.length} enabled steps`);
    let offset = 0;

    leaves.forEach(step => {
      const start = offset + 200 + Math.random() * 150;
      const duration = 500 + Math.random() * 1500;
      offset = start + duration;
      runTimers.current.push(setTimeout(() => {
        setPlan(prev => setStatusIn(prev, step.id, "running"));
        addLog("INFO", step.type.toUpperCase(), `-> ${step.name}`);
      }, start));

      const verdict: StepStatus = Math.random() > 0.1 ? "passed" : "failed";
      runTimers.current.push(setTimeout(() => {
        setPlan(prev => setStatusIn(prev, step.id, verdict));
        addLog(verdict === "passed" ? "PASS" : "FAIL", step.type.toUpperCase(), `  ${step.name}: ${verdict.toUpperCase()} (${duration.toFixed(0)}ms)`);
        if (verdict === "failed") addLog("ERROR", step.type.toUpperCase(), "  Out-of-limits condition detected");
      }, start + duration));
    });

    const finishTimer = setTimeout(() => {
      setRunState("completed");
      addLog("INFO", "EdgeX", `=== Run complete - ${(offset / 1000).toFixed(2)}s ===`);
    }, offset + 300);
    runTimers.current.push(finishTimer);
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

  const refreshPluginData = useCallback(() => {
  refetchInstalledPlugins();
  refetchAvailablePackages();
}, [refetchInstalledPlugins, refetchAvailablePackages]);

const handleInstallPlugin = async (id: string) => {
  const plugin = plugins.find(item => item.id === id);
  const pluginName = plugin?.name ?? "Plugin";
  const action = plugin?.isInstalled ? "updated" : "installed";

  try {
    setPlugins(prev => prev.map(item => item.id === id ? { ...item, state: "installing" } : item));
    await installPackage(pluginName);
    setPlugins(prev => prev.map(item => item.id === id
      ? { ...item, state: "installed", isInstalled: true, status: "Installed", updateAvailable: false }
      : item
    ));
    addLog("INFO", "Plugins", `${action === "updated" ? "Updated" : "Installed"}: ${pluginName}`);
    toast.success(`${pluginName} ${action} successfully`);
    refreshPluginData();
    setTimeout(refreshPluginData, 1500); // safety net in case backend hasn't registered the install yet
  } catch {
    setPlugins(prev => prev.map(item => item.id === id
      ? { ...item, state: item.isInstalled ? "installed" : "available" }
      : item
    ));
    addLog("ERROR", "Plugins", `Unable to ${action === "updated" ? "update" : "install"}: ${pluginName}`);
    toast.error(`Failed to ${action === "updated" ? "update" : "install"} ${pluginName}`);
  }
};

  const handleUninstallPlugin = async (id: string) => {
  const plugin = installedPlugins.find(item => item.id === id);
  const pluginName = plugin?.name ?? "Plugin";
  const uninstallName = plugin?.uninstallName ?? pluginName;
  try {
    await removePlugin(uninstallName);
    setInstalledPlugins(prev => prev.filter(item => item.id !== id));
    addLog("INFO", "Plugins", `Uninstalled: ${pluginName}`);
    toast.success(`${pluginName} uninstalled successfully`);
    refreshPluginData();
    setTimeout(refreshPluginData, 1500);
  } catch {
    addLog("ERROR", "Plugins", `Unable to uninstall: ${pluginName}`);
    toast.error(`Failed to uninstall ${pluginName}`);
  }
};

const handleUninstallPackage = async (id: string) => {
  const plugin = plugins.find(item => item.id === id);
  const pluginName = plugin?.name ?? "Plugin";
  const uninstallName = plugin?.uninstallName ?? pluginName;

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
    toast.success(`${pluginName} uninstalled successfully`);
    refreshPluginData();
    setTimeout(refreshPluginData, 1500);
  } catch {
    setPlugins(prev => prev.map(item => item.id === id ? { ...item, state: "installed", isInstalled: true } : item));
    addLog("ERROR", "Plugins", `Unable to uninstall: ${pluginName}`);
    toast.error(`Failed to uninstall ${pluginName}`);
  }
};
const handleUploadPlugin = async (file: File) => {
  try {
    await uploadPlugin(file);
    addLog("INFO", "Plugins", `Installed: ${file.name}`);
    toast.success(`${file.name} installed successfully`);
    refreshPluginData();
    setTimeout(refreshPluginData, 1500);
    setShowPluginMgr(false);
  } catch {
    addLog("ERROR", "Plugins", `Unable to install: ${file.name}`);
    toast.error(`Failed to install ${file.name}`);
  }
};

  const handleSave = () => {
    const blob = new Blob([JSON.stringify({ meta: planMeta, plan }, null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${planMeta.name.replace(/\s+/g, "_")}.edgex`;
    anchor.click();
    addLog("INFO", "FileIO", `Saved: ${planMeta.name}.edgex`);
  };

  const handleSeqDrop = (event: DragEvent, parentId: string | null, idx: number) => {
    event.preventDefault();
    if (!dragLibItem) return;
    handleAddStep(dragLibItem, parentId, idx);
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
    handleSeqDrop,
    setPlan,
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
    handleAddStep,
    plugins,
    installedPlugins,
    handleInstallPlugin,
    handleUninstallPlugin,
    handleUninstallPackage,
    setShowPluginMgr,
    instruments: instruments ?? [],
    isInstrumentsLoading,
    isInstrumentsError,
    plan,
    planMeta,
    stats,
    activeMenu,
    setActiveMenu,
    handleSave,
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
  };
}
