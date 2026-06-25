import { Check, Database, Download, Filter, FolderPlus, List, Package, Search, X } from "lucide-react";
import { TYPE_STRIPE } from "../../constants/editor";
import { flatAll } from "../../utils/editor";
import { StepTree } from "./StepTree";

interface LeftPanelProps {
  leftTab: "plan" | "library" | "plugins";
  setLeftTab: (value: "plan" | "library" | "plugins") => void;
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
  return (
    <>
      <div className="flex border-b border-border shrink-0">
        {([
          ["plan", "Plan", <List size={12} />],
          ["library", "Library", <Database size={12} />],
          ["plugins", "Plugins", <Package size={12} />],
        ] as const).map(([tab, label, icon]) => (
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
          <div className="flex items-center gap-1 px-3 h-8 border-b border-border shrink-0 bg-muted/20">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex-1">Test Plan Tree</span>
            <button onClick={() => setExpanded(new Set(flatAll(plan).map(step => step.id)))} className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-secondary">Expand</button>
            <button onClick={() => setExpanded(new Set())} className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-secondary">Collapse</button>
            {hasPlan && <button onClick={handleAddGroup} className="text-muted-foreground hover:text-primary p-0.5 hover:bg-secondary ml-1"><FolderPlus size={12} /></button>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!hasPlan ? (
              <div className="px-4 py-6 text-center">
                <div className="text-[12px] text-muted-foreground font-mono mb-3">No plan open</div>
                <button onClick={() => setShowNewPlan(true)} className="px-3 py-1.5 bg-primary text-primary-foreground text-[12px] font-mono hover:bg-primary/90">Create Plan</button>
              </div>
            ) : plan.length === 0 ? (
              <div className="px-4 py-4 text-center">
                <div className="text-[12px] text-muted-foreground font-mono mb-2">Empty plan</div>
                <button onClick={handleAddGroup} className="text-primary text-[12px] font-mono hover:underline">+ Add sequence</button>
              </div>
            ) : plan.map(step => (
              <StepTree
                key={step.id}
                step={step}
                selectedId={selectedId}
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
        </>
      )}

      {leftTab === "library" && (
        <>
          <div className="flex items-center gap-2 px-2 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2 border border-border px-2.5 py-1.5 bg-background flex-1">
              <Search size={11} className="text-muted-foreground shrink-0" />
              <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search library..." className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
              {libSearch && <button onClick={() => setLibSearch("")} className="text-muted-foreground hover:text-foreground shrink-0"><X size={10} /></button>}
            </div>
            <div className="relative shrink-0">
              <button
                onClick={e => {
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
                <div className="absolute right-0 top-9 bg-popover border border-border shadow-xl z-50 w-44 py-1" onClick={e => e.stopPropagation()}>
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">Filter by Category</div>
                  {libCats.map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        setLibCat(category);
                        setLibFilterOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12px] font-mono flex items-center justify-between transition-colors"
                      style={libCat === category ? { background: "rgba(34,62,84,0.10)", color: "#223e54", borderLeft: "2px solid #223e54" } : {}}
                    >
                      <span className={libCat === category ? "font-semibold" : "text-muted-foreground"}>{category}</span>
                      {libCat === category && <Check size={11} style={{ color: "#223e54" }} />}
                    </button>
                  ))}
                  {libCat !== "All" && (
                    <div className="border-t border-border mt-1 pt-1">
                      <button onClick={() => { setLibCat("All"); setLibFilterOpen(false); }} className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {libCat !== "All" && (
            <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 shrink-0" style={{ background: "rgba(34,62,84,0.05)" }}>
              <span className="text-[11px] font-mono" style={{ color: "#223e54" }}>Filter: {libCat}</span>
              <button onClick={() => setLibCat("All")} className="ml-auto text-muted-foreground hover:text-foreground"><X size={10} /></button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {filteredLib.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragLibItem(item)}
                onDragEnd={() => { setDragLibItem(null); setDropIdx(null); }}
                onDoubleClick={() => {
                  if (!hasPlan) {
                    setShowNewPlan(true);
                    return;
                  }
                  handleAddStep(item, selectedStep?.type === "sequence" ? selectedId : null);
                }}
                className="flex items-start gap-2.5 px-3 py-2.5 cursor-grab group border-b border-border/30 transition-colors"
              >
                <div className="w-[3px] h-4 mt-0.5 shrink-0" style={{ background: TYPE_STRIPE[item.type] || "#64748b" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-mono text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                    {item.pluginId && <span className="text-[9px] font-mono text-primary border border-primary/30 px-1 shrink-0">plugin</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Base Type: {item.baseType}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Assembly: {item.assembly}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-3 h-7 border-t border-border flex items-center shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground">{filteredLib.length} steps</span>
            <span className="ml-auto text-[10px] font-mono text-primary/60">drag or double-click</span>
          </div>
        </>
      )}

      {leftTab === "plugins" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {plugins.map(plugin => (
              <div key={plugin.id} className="px-3 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-mono text-foreground font-medium">{plugin.name}</span>
                  <span className={`text-[10px] font-mono font-semibold ${plugin.status === "installed" ? "text-emerald-500" : plugin.status === "installing" ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`}>
                    {plugin.status === "installed" ? "ACTIVE" : plugin.status === "installing" ? "INSTALLING" : "AVAILABLE"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">v{plugin.version} - {plugin.steps.length} steps</div>
                {plugin.status === "available" && (
                  <button onClick={() => handleInstallPlugin(plugin.id)} className="mt-1.5 text-[11px] font-mono text-primary border border-primary/30 px-2 py-0.5 hover:bg-primary/10 flex items-center gap-1">
                    <Download size={10} /> Install
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <button onClick={() => setShowPluginMgr(true)} className="w-full h-8 border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors">
              <Package size={12} /> Manage Plugins
            </button>
          </div>
        </div>
      )}
    </>
  );
}
