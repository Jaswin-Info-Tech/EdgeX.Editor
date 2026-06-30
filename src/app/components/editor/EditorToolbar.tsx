import { useState } from "react";
import { Cpu, FilePlus, FolderOpen, FolderPlus, Package, Pause, Play, Plus, RotateCcw, Save, Square } from "lucide-react";
import { ToolBtn } from "./atoms";

interface EditorToolbarProps {
  isTablet: boolean;
  hasPlan: boolean;
  plan: any[];
  stats: any;
  runState: string;
  setShowNewPlan: (value: boolean) => void;
  setLeftTab: (value: "plan" | "library" | "plugins" | "instruments") => void;
  setShowPluginMgr: (value: boolean) => void;
  setShowInstrumentsPanel: (value: boolean) => void;
  setShowDutsPanel: (value: boolean) => void;
  setShowTestPlansPanel: (value: boolean) => void;
  setAddStepParentId: (value: string | null) => void;
  setAddStepIdx: (value: number | undefined) => void;
  setShowAddStep: (value: boolean) => void;
  handleSave: () => void;
  handleRun: () => void;
  handlePause: () => void;
  handleStop: () => void;
  handleReset: () => void;
  handleAddGroup: () => void;
}

export function EditorToolbar({
  isTablet,
  hasPlan,
  plan,
  stats,
  runState,
  setShowNewPlan,
  setLeftTab,
  setShowPluginMgr,
  setShowInstrumentsPanel,
  setShowDutsPanel,
  setShowTestPlansPanel,
  setAddStepParentId,
  setAddStepIdx,
  setShowAddStep,
  handleSave,
  handleRun,
  handlePause,
  handleStop,
  handleReset,
  handleAddGroup,
}: EditorToolbarProps) {
  const [showBenchMenu, setShowBenchMenu] = useState(false);

  const handleBenchAction = (target: "instruments" | "duts") => {
    setShowBenchMenu(false);
    if (target === "instruments") setShowInstrumentsPanel(true);
    else setShowDutsPanel(true);
  };

  return (
    <div className="flex items-center bg-card border-b border-border h-10 px-2 shrink-0 gap-1">
      <div className="flex items-center gap-0.5">
        <ToolBtn onClick={() => setShowNewPlan(true)} title="New Test Plan (Ctrl+N)"><FilePlus size={14} />{!isTablet && "New"}</ToolBtn>
        <ToolBtn onClick={() => { }} title="Open (Ctrl+O)"><FolderOpen size={14} />{!isTablet && "Open"}</ToolBtn>
        <ToolBtn onClick={handleSave} disabled={!hasPlan} title="Save (Ctrl+S)"><Save size={14} />{!isTablet && "Save"}</ToolBtn>
      </div>

      <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

      <div className="flex items-center gap-0.5">
        <ToolBtn variant="run" onClick={handleRun} disabled={runState === "running" || !hasPlan || plan.length === 0} title="Run (F5)">
          <Play size={13} fill="currentColor" /> Run
        </ToolBtn>
        <ToolBtn onClick={handlePause} disabled={runState === "idle" || runState === "completed"} active={runState === "paused"} title="Pause (F6)">
          <Pause size={13} />
        </ToolBtn>
        <ToolBtn variant="danger" onClick={handleStop} disabled={runState === "idle" || runState === "completed"} title="Stop (F7)">
          <Square size={13} fill="currentColor" />
        </ToolBtn>
        <ToolBtn onClick={handleReset} disabled={!hasPlan} title="Reset"><RotateCcw size={13} /></ToolBtn>
      </div>

      <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

      <div className="flex items-center gap-0.5">
        <ToolBtn onClick={handleAddGroup} disabled={!hasPlan} title="Add Sequence">
          <FolderPlus size={14} />{!isTablet && "Sequence"}
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            setAddStepParentId(null);
            setAddStepIdx(undefined);
            setShowAddStep(true);
          }}
          disabled={!hasPlan}
          title="Add Step"
        >
          <Plus size={14} />{!isTablet && "Step"}
        </ToolBtn>
      </div>

      <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

      <ToolBtn onClick={() => setShowPluginMgr(true)} title="Plugin Manager">
        <Package size={14} />{!isTablet && "Plugins"}
      </ToolBtn>
      <div className="relative">
        <ToolBtn onClick={() => setShowBenchMenu((value) => !value)} title="Bench">
          <Cpu size={14} />{!isTablet && "Bench"}
        </ToolBtn>
        {showBenchMenu && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] border border-border bg-popover shadow-xl">
            <button
              onClick={() => handleBenchAction("instruments")}
              className="flex w-full items-center px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Instruments
            </button>
            <button
              onClick={() => handleBenchAction("duts")}
              className="flex w-full items-center px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              DUTs
            </button>
          </div>
        )}
      </div>
      <ToolBtn onClick={() => setShowTestPlansPanel(true)} title="Test Plans">
        <FolderPlus size={14} />{!isTablet && "Test Plans"}
      </ToolBtn>

      <div className="ml-auto flex items-center gap-3 font-mono text-[12px] text-muted-foreground shrink-0">
        {hasPlan && (
          <>
            <span className="hidden md:block">{stats.total} steps</span>
            {stats.passed > 0 && <span className="text-emerald-500 font-semibold">{stats.passed} PASS</span>}
            {stats.failed > 0 && <span className="text-red-500 font-semibold">{stats.failed} FAIL</span>}
            {runState === "running" && <span className="text-yellow-500 font-semibold animate-pulse">RUNNING</span>}
          </>
        )}
      </div>
    </div>
  );
}
