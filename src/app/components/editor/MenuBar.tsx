import { Moon, PanelLeftOpen, PanelRightOpen, Sun, Check, Settings } from "lucide-react";

const MENU_ITEMS: Record<string, string[]> = {
  File: ["Import Plan","Export Plan"],
  View: ["Step Library", "Properties", "Console", "-", "Reset Layout"],
  Bench: ["Instruments", "DUTs", "Connections", "Result Listeners", "Trace Listeners"],
};

interface MenuBarProps {
  activeMenu: string | null;
  setActiveMenu: (value: string | null) => void;
  hasPlan: boolean;
  planMeta: any;
  runState: string;
  isTablet: boolean;
  leftOpen: boolean;
  setLeftOpen: (updater: any) => void;
  rightOpen: boolean;
  setRightOpen: (updater: any) => void;
  showConsole: boolean;
  setShowConsole: (updater: any) => void;
  isDark: boolean;
  setIsDark: (updater: any) => void;
  setShowNewPlan: (value: boolean) => void;
  setShowPluginMgr: (value: boolean) => void;
  setShowInstrumentsPanel: (value: boolean) => void;
  setShowDutsPanel: (value: boolean) => void;
  setShowConnectionsPanel: (value: boolean) => void;
  setShowResultListenersPanel: (value: boolean) => void;
  setShowTraceListenersPanel: (value: boolean) => void;
  activeServerName: string;
  activeServerHealth: "healthy" | "error" | "stale" | "untested";
  onOpenServerSettings: () => void;
  handleSave: () => void;
  handleExportPlan: () => void;
  handleImportPlan: () => void;
  handleRun: () => void;
  handleStop: () => void;
  handlePause: () => void;
  handleReset: () => void;
}

export function MenuBar({
  activeMenu,
  setActiveMenu,
  hasPlan,
  planMeta,
  runState,
  isTablet,
  leftOpen,
  setLeftOpen,
  rightOpen,
  setRightOpen,
  showConsole,
  setShowConsole,
  isDark,
  setIsDark,
  setShowNewPlan,
  setShowPluginMgr,
  setShowInstrumentsPanel,
  setShowDutsPanel,
  setShowConnectionsPanel,
  setShowResultListenersPanel,
  setShowTraceListenersPanel,
  activeServerName,
  activeServerHealth,
  onOpenServerSettings,
  handleSave,
  handleExportPlan,
  handleImportPlan,
  handleRun,
  handleStop,
  handlePause,
  handleReset,
}: MenuBarProps) {
  const runStatusStyle = runState === "running" ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/10 animate-pulse"
    : runState === "paused" ? "text-orange-500 border-orange-500/40 bg-orange-500/10"
      : runState === "completed" ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
        : "text-muted-foreground border-border";

  const serverHealthStyles =
    activeServerHealth === "healthy"
      ? "bg-emerald-500"
      : activeServerHealth === "error"
        ? "bg-red-500"
        : activeServerHealth === "stale"
          ? "bg-amber-500"
          : "bg-muted-foreground/60";

  const serverHealthLabel =
    activeServerHealth === "healthy"
      ? "Healthy"
      : activeServerHealth === "error"
        ? "Failed"
        : activeServerHealth === "stale"
          ? "Stale"
          : "Not Tested";

  const runMenuAction = (item: string) => {
    setActiveMenu(null);
    if (item === "New Test Plan") setShowNewPlan(true);
    if (item === "Save") handleSave();
    if (item === "Plugin Manager") setShowPluginMgr(true);
    if (item === "Instruments") setShowInstrumentsPanel(true);
    if (item === "DUTs") setShowDutsPanel(true);
    if (item === "Connections") setShowConnectionsPanel(true);
    if (item === "Result Listeners") setShowResultListenersPanel(true);
    if (item === "Trace Listeners") setShowTraceListenersPanel(true);
    if (item === "Run All") handleRun();
    if (item === "Stop") handleStop();
    if (item === "Pause") handlePause();
    if (item === "Reset Plan") handleReset();
    if (item === "Step Library") setLeftOpen((value: boolean) => !value);
    if (item === "Properties") setRightOpen((value: boolean) => !value);
    if (item === "Console") setShowConsole((value: boolean) => !value);
    if (item === "Reset Layout") {
      setLeftOpen(true);
      setRightOpen(true);
      setShowConsole(true);
    }
    if (item === "Export Plan") handleExportPlan();
    if (item === "Import Plan") handleImportPlan();
  };

  return (
    <div className="flex items-center bg-card border-b-2 border-primary h-8 px-3 shrink-0 gap-0">
      <div className="flex items-center gap-2 mr-5 shrink-0">
        <div className="w-[3px] h-5 bg-primary" />
        <span className="text-[14px] font-black tracking-[0.15em] font-mono">
          <span className="text-foreground">EDGE</span><span className="text-primary">X</span>
        </span>
        <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 ml-0.5">v1.0</span>
      </div>

      {Object.keys(MENU_ITEMS).map(menu => (
        <div key={menu} className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setActiveMenu(activeMenu === menu ? null : menu);
            }}
            className={`px-3 h-8 text-[12px] font-medium transition-colors
              ${activeMenu === menu ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            {menu}
          </button>
          {activeMenu === menu && (
            <div className="absolute top-8 left-0 bg-popover border border-border shadow-2xl z-50 w-48 py-1" onClick={e => e.stopPropagation()}>
              {MENU_ITEMS[menu].map((item, index) =>
                item === "-" ? <div key={index} className="border-t border-border my-1" /> : (
                  <button
                    key={item}
                    onClick={() => runMenuAction(item)}
                    className="w-full text-left px-4 py-2 text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-between"
                  >
                    <span>{item}</span>
                    {menu === "View" && item !== "Reset Layout" && (
                      <div className="w-4 h-4 border border-border rounded flex items-center justify-center">
                        {((item === "Step Library" && leftOpen) ||
                          (item === "Properties" && rightOpen) ||
                          (item === "Console" && showConsole)) && (
                          <Check size={12} className="text-foreground" />
                        )}
                      </div>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2 shrink-0">
        {hasPlan && (
          <div className="flex items-center gap-2 border-r border-border pr-3 mr-1">
            {planMeta.dutName && <span className="text-[11px] font-mono text-muted-foreground hidden lg:block">DUT: {planMeta.dutName}</span>}
          </div>
        )}
        <span
          className="hidden max-w-[260px] truncate border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground lg:inline-flex lg:items-center lg:gap-1.5"
          title={`Server: ${activeServerName || "Not configured"} | Health: ${serverHealthLabel}`}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${serverHealthStyles}`} />
          <span>Server: {activeServerName || "Not configured"}</span>
        </span>
        <span className={`text-[11px] font-mono px-2 py-0.5 border font-semibold ${runStatusStyle}`}>{runState.toUpperCase()}</span>
        {isTablet && (
          <>
            <button onClick={() => setLeftOpen((value: boolean) => !value)} className={`p-1.5 border transition-colors ${leftOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <PanelLeftOpen size={13} />
            </button>
            <button onClick={() => setRightOpen((value: boolean) => !value)} className={`p-1.5 border transition-colors ${rightOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              <PanelRightOpen size={13} />
            </button>
          </>
        )}
        <button
          onClick={onOpenServerSettings}
          title="API server settings"
          className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Settings size={13} />
        </button>
        <button
          onClick={() => setIsDark((value: boolean) => !value)}
          title={isDark ? "Light mode" : "Dark mode"}
          className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  );
}
