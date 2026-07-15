import { useEffect, useState } from "react";
import { Check, Copy, Download, FolderOpen, Minus, Moon, PanelLeftOpen, PanelRightOpen, Settings, Square, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

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
  const electronAPI = window.electronAPI;
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const installerUrl = import.meta.env.VITE_DESKTOP_INSTALLER_URL as string | undefined;

  const downloadInstaller = async () => {
    setIsDownloading(true);
    setDownloadedPath(null);
    setDownloadProgress(0);
    try {
      if (!installerUrl) {
        toast.error("The desktop installer has not been published yet.");
        setIsDownloading(false);
        return;
      }
      if (electronAPI) {
        const result = await electronAPI.downloadInstaller({ url: installerUrl });
        if (result.status === "started") {
          toast.info("Download started. The installer will be saved in Downloads.");
        } else {
          toast.error(result.message || "Unable to download the installer.");
          setIsDownloading(false);
        }
      } else {
        const link = document.createElement("a");
        link.href = installerUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.info("Download started. Check your browser's Downloads section.");
        setShowInstallDialog(false);
        setIsDownloading(false);
      }
    } catch {
      toast.error("The download could not be started. Please try again.");
    } finally {
      if (!electronAPI) setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!electronAPI) return;
    return electronAPI.onInstallerDownloadProgress((progress) => {
      if (progress.totalBytes > 0) setDownloadProgress(Math.round((progress.receivedBytes / progress.totalBytes) * 100));
      if (progress.state === "completed" && progress.filePath) {
        setIsDownloading(false);
        setDownloadedPath(progress.filePath);
        setDownloadProgress(100);
        toast.success("Installer downloaded to your Downloads folder.");
      } else if (progress.state === "cancelled" || progress.state === "interrupted") {
        setIsDownloading(false);
        toast.error("The installer download was interrupted.");
      }
    });
  }, [electronAPI]);

  useEffect(() => {
    if (!electronAPI) return;

    let mounted = true;
    void electronAPI.isWindowMaximized().then((maximized) => {
      if (mounted) setIsWindowMaximized(maximized);
    });
    const unsubscribe = electronAPI.onWindowMaximizedChange(setIsWindowMaximized);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [electronAPI]);

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
    <div className="electron-drag-region flex items-center bg-card border-b-2 border-primary h-8 pl-3 shrink-0 gap-0">
      <div className="flex items-center gap-2 mr-5 shrink-0">
        <div className="w-[3px] h-5 bg-primary" />
        <span className="text-[14px] font-black tracking-[0.15em] font-mono">
          <span className="text-foreground">EDGE</span><span className="text-primary">X</span>
        </span>
        <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 ml-0.5">v1.0</span>
      </div>

      {Object.keys(MENU_ITEMS).map(menu => (
        <div key={menu} className="electron-no-drag relative">
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
            {/* <span className="text-[11px] font-mono text-muted-foreground hidden md:block">{planMeta.name}</span> */}
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
        <button
          type="button"
          onClick={() => { setDownloadedPath(null); setShowInstallDialog(true); }}
          title="Download the EdgeX Editor desktop application"
          className="electron-no-drag flex h-7 items-center gap-1.5 border border-primary bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download size={13} />
          <span className="hidden xl:inline">Install app</span>
        </button>
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
        {electronAPI && (
          <div className="electron-no-drag ml-1 flex h-8 items-stretch" aria-label="Window controls">
            <button
              type="button"
              onClick={() => void electronAPI.minimizeWindow()}
              title="Minimize"
              aria-label="Minimize window"
              className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => void electronAPI.toggleMaximizeWindow().then(setIsWindowMaximized)}
              title={isWindowMaximized ? "Restore" : "Maximize"}
              aria-label={isWindowMaximized ? "Restore window" : "Maximize window"}
              className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {isWindowMaximized
                ? <Copy size={12} strokeWidth={1.5} />
                : <Square size={12} strokeWidth={1.5} />}
            </button>
            <button
              type="button"
              onClick={() => void electronAPI.closeWindow()}
              title="Close"
              aria-label="Close window"
              className="flex w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-red-600 hover:text-white"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      <Dialog open={showInstallDialog} onOpenChange={(open) => !isDownloading && setShowInstallDialog(open)}>
        <DialogContent className="electron-no-drag sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install EdgeX Editor</DialogTitle>
            <DialogDescription>
              Download the desktop installer for offline access and a native application experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-muted-foreground">
              {electronAPI
                ? "The installer will be saved automatically in your Downloads folder."
                : "The installer will appear in your browser's Downloads section and use its normal download location."}
            </div>
            {isDownloading && electronAPI && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Downloading installer…</span><span>{downloadProgress}%</span></div>
                <div className="h-2 overflow-hidden rounded bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${downloadProgress}%` }} /></div>
              </div>
            )}
            {downloadedPath && (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
                <div className="font-medium text-emerald-600">Installer ready</div>
                <div className="mt-1 break-all text-xs text-muted-foreground">{downloadedPath}</div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {downloadedPath && electronAPI ? (
                <button type="button" onClick={() => void electronAPI.showDownloadedInstaller(downloadedPath)} className="flex items-center gap-2 border border-border px-3 py-2 hover:bg-secondary">
                  <FolderOpen size={14} /> Show in folder
                </button>
              ) : (
                <button type="button" disabled={isDownloading} onClick={() => setShowInstallDialog(false)} className="border border-border px-3 py-2 hover:bg-secondary disabled:opacity-50">Cancel</button>
              )}
              {!downloadedPath && (
                <button type="button" disabled={isDownloading} onClick={() => void downloadInstaller()} className="flex items-center gap-2 bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
                  <Download size={14} /> {isDownloading ? "Downloading…" : "Download installer"}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
