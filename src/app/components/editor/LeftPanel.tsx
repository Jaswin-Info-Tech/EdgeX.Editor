import * as React from "react";
import {
  Check,
  ChevronRight,
  Database,
  Filter,
  FolderPlus,
  List,
  Search,
  X,
  ChevronUp,
} from "lucide-react";
import { TYPE_STRIPE } from "../../constants/editor";
import type { InstrumentItem, LibraryItem } from "../../types/editor";
import { flatAll } from "../../utils/editor";
import { StepTree } from "./StepTree";

function instrumentToLibraryItem(instrument: InstrumentItem): LibraryItem {
  return {
    id: `instrument:${instrument.name}:${instrument.assembly}`,
    name: instrument.name,
    category: "Instruments",
    type: "instrument",
    description: `Instrument from ${instrument.assembly}`,
    baseType: instrument.baseType,
    assembly: instrument.assembly,
    defaultProps: [
      { key: "instrumentName", label: "Instrument Name", type: "string", value: instrument.name, group: "Instrument" },
      { key: "baseType", label: "Base Type", type: "string", value: instrument.baseType, group: "Instrument" },
      { key: "assembly", label: "Assembly", type: "string", value: instrument.assembly, group: "Instrument" },
    ],
  };
}

interface LeftPanelProps {
  leftTab: "plan" | "library" | "instruments";
  setLeftTab: (value: "plan" | "library" | "instruments") => void;
  plan: any[];
  hasPlan: boolean;
  expanded: Set<string>;
  setExpanded: (value: Set<string>) => void;
  handleAddGroup: () => void;
  setShowNewPlan: (value: boolean) => void;
  libSearch: string;
  setLibSearch: (value: string) => void;
  libCat: string;
  setLibCat: (value: string) => void;
  libCats: string[];
  libFilterOpen: boolean;
  setLibFilterOpen: (updater: any) => void;
  filteredLib: any[];
  data: any[] | undefined;
  instruments: InstrumentItem[];
  instrumentSearch: string;
  setInstrumentSearch: (value: string) => void;
  isInstrumentsLoading: boolean;
  isInstrumentsError: boolean;
  setDragLibItem: (value: any) => void;
  setDropIdx: (value: number | null) => void;
  handleAddStep: (item: any, parentId?: string | null) => void;
  selectedStep: any;
  selectedId: string | null;
  plugins: any[];
  handleInstallPlugin: (id: string) => void;
  setShowPluginMgr: (value: boolean) => void;
  renaming: string | null;
  renameRef: React.RefObject<HTMLInputElement>;
  renameVal: string;
  setRenameVal: (value: string) => void;
  commitRename: () => void;
  setRenaming: (value: string | null) => void;
  setSelectedId: (value: string | null) => void;
  setContextMenu: (value: { x: number; y: number; stepId: string }) => void;
  toggleExpand: (id: string) => void;
}

export function LeftPanel({
  leftTab,
  setLeftTab,
  plan,
  hasPlan,
  expanded,
  setExpanded,
  handleAddGroup,
  setShowNewPlan,
  libSearch,
  setLibSearch,
  libCat,
  setLibCat,
  libCats,
  libFilterOpen,
  setLibFilterOpen,
  filteredLib,
  data,
  setDragLibItem,
  setDropIdx,
  handleAddStep,
  selectedStep,
  selectedId,
  plugins,
  handleInstallPlugin,
  setShowPluginMgr,
  instruments,
  instrumentSearch,
  setInstrumentSearch,
  isInstrumentsLoading,
  isInstrumentsError,
  renaming,
  renameRef,
  renameVal,
  setRenameVal,
  commitRename,
  setRenaming,
  setSelectedId,
  setContextMenu,
  toggleExpand,
}: LeftPanelProps) {
  const rowAccentColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#a855f7",
    "#ef4444",
    "#06b6d4",
  ];

  const selectedPathIds = React.useMemo(() => {
    if (!selectedId) return new Set<string>();

    const path = new Set<string>();
    const walk = (steps: any[]): boolean => {
      for (const s of steps) {
        if (s.id === selectedId) {
          path.add(s.id);
          return true;
        }
        if (s.children?.length && walk(s.children)) {
          path.add(s.id);
          return true;
        }
      }
      return false;
    };

    walk(plan);
    return path;
  }, [plan, selectedId]);

  return (
    <>
      <div className="flex border-b border-border shrink-0">
        {(
          [
            ["plan", "Plan", <List size={12} />],
            ["library", "Steps", <Database size={12} />],
          ] as const
        ).map(([tab, label, icon]) => (
          <button
            key={tab}
            onClick={() => setLeftTab(tab)}
            className={`flex-1 h-9 text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors
              ${leftTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {leftTab === "plan" && (
        <>
          <div className="border-b border-border shrink-0 bg-gradient-to-b from-muted/25 to-card">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-foreground">
                  Plan Structure
                </div>
                <div className="mt-0.5 text-[10px] font-mono text-muted-foreground">
                  {hasPlan ? `${flatAll(plan).length} steps in navigator` : "No plan loaded"}
                </div>
              </div>
            {(() => {
              const allIds = flatAll(plan).map((step) => step.id);
              const isAllExpanded =
                allIds.length > 0 && allIds.every((id) => expanded.has(id));
              return (
                <button
                  onClick={() =>
                    setExpanded(isAllExpanded ? new Set() : new Set(allIds))
                  }
                  title={isAllExpanded ? "Collapse all" : "Expand all"}
                  className="flex h-7 w-7 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
                >
                  <ChevronUp
                    size={13}
                    className="transition-transform duration-200"
                    style={{
                      transform: isAllExpanded
                        ? "rotate(0deg)"
                        : "rotate(180deg)",
                    }}
                  />
                </button>
              );
            })()}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-card/60">
            {!hasPlan ? (
              <div className="px-4 py-6 text-center">
                <button
                  onClick={() => setShowNewPlan(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-[12px] font-mono hover:bg-primary/90"
                >
                  Create Plan
                </button>
              </div>
            ) : (
              <div className="px-2 py-2">
                <div className="rounded-md border border-border/70 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  {plan.map((step, index) => (
                    <StepTree
                      key={step.id}
                      step={step}
                      orderPath={String(index + 1)}
                      selectedId={selectedId}
                      selectedPathIds={selectedPathIds}
                      expanded={expanded}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {leftTab === "library" && (
        <>
          <div className="flex items-center gap-2 px-2 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2 border border-border px-2.5 py-1.5 bg-background flex-1">
              <Search size={11} className="text-muted-foreground shrink-0" />
              <input
                value={libSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLibSearch(e.target.value)
                }
                placeholder="Search step library..."
                className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
              />
              {libSearch && (
                <button
                  onClick={() => setLibSearch("")}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLibFilterOpen((value: boolean) => !value);
                }}
                className={`flex items-center justify-center w-8 h-8 border transition-colors
                  ${libCat !== "All" || libFilterOpen ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
                title="Filter by category"
              >
                <Filter size={13} />
              </button>
              {libFilterOpen && (
                <div
                  className="absolute right-0 top-9 bg-popover border border-border shadow-xl z-50 w-44 py-1"
                  onClick={(e: React.MouseEvent<HTMLDivElement>) =>
                    e.stopPropagation()
                  }
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                    Filter by Category
                  </div>
                  {libCats.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setLibCat(category);
                        setLibFilterOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-mono flex items-center justify-between transition-colors"
                      style={
                        libCat === category
                          ? {
                              background: "rgba(34,62,84,0.10)",
                              color: "#223e54",
                              borderLeft: "2px solid #223e54",
                            }
                          : {}
                      }
                    >
                      <span
                        className={
                          libCat === category
                            ? "font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {category}
                      </span>
                      {libCat === category && (
                        <Check size={11} style={{ color: "#223e54" }} />
                      )}
                    </button>
                  ))}
                  {libCat !== "All" && (
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          setLibCat("All");
                          setLibFilterOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {libCat !== "All" && (
            <div
              className="px-3 py-1.5 border-b border-border flex items-center gap-2 shrink-0"
              style={{ background: "rgba(34,62,84,0.05)" }}
            >
              <span
                className="text-[11px] font-mono"
                style={{ color: "#223e54" }}
              >
                Filter: {libCat}
              </span>
              <button
                onClick={() => setLibCat("All")}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-3 py-1.5 backdrop-blur">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className="min-w-0 flex-1">Step</span>
                <span className="shrink-0">Details</span>
              </div>
            </div>
            {filteredLib.length === 0 && (
              <div className="px-4 py-8 text-center text-[11px] font-mono text-muted-foreground">
                No steps match your search or filter.
              </div>
            )}
            {filteredLib.map((item, index) => {
              const rowKey = `${item.id || item.name || "step"}-${item.baseType || ""}-${item.assembly || ""}-${index}`;
              return (
              <div
                key={rowKey}
                draggable
                onDragStart={(event) => {
                  setDragLibItem(item);
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData(
                    "application/x-edgex-step",
                    String(item.id || item.name || "step"),
                  );
                }}
                onDragEnd={() => {
                  setDragLibItem(null);
                  setDropIdx(null);
                }}
                onDoubleClick={() => {
                  if (!hasPlan) {
                    setShowNewPlan(true);
                    return;
                  }
                  handleAddStep(
                    item,
                    selectedStep?.type === "sequence" ? selectedId : null,
                  );
                }}
                className="group cursor-grab border-b border-l-2 border-l-transparent border-border/40 px-3 py-2.5 transition-colors hover:border-l-primary/60 hover:bg-secondary/40"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 h-4 w-[3px] shrink-0"
                    style={{
                      background:
                        rowAccentColors[index % rowAccentColors.length] ||
                        TYPE_STRIPE[item.type] ||
                        "#64748b",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold text-foreground transition-colors group-hover:text-primary">
                        {item.name}
                      </span>
                      {item.pluginId && (
                        <span className="shrink-0 border border-primary/30 bg-primary/10 px-1 text-[9px] font-mono text-primary">
                          plugin
                        </span>
                      )}
                      <ChevronRight size={12} className="ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      <span className="shrink-0 uppercase tracking-wide text-muted-foreground/80">Base</span>
                      <span className="truncate" title={item.baseType || "-"}>{item.baseType || "-"}</span>
                      <span className="shrink-0 text-muted-foreground/50">|</span>
                      <span className="shrink-0 uppercase tracking-wide text-muted-foreground/80">Asm</span>
                      <span
                        className="min-w-0 truncate"
                        title={item.assembly || "-"}
                      >
                        {item.assembly || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
          <div className="px-3 h-7 border-t border-border flex items-center shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground">
              {filteredLib.length} steps
            </span>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground/80">
              drag or double-click to add
            </span>
          </div>
        </>
      )}
    </>
  );
}
