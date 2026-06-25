import { Plus, Sliders, Trash2 } from "lucide-react";
import { TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, formatFreq, updateIn } from "../../utils/editor";
import { StatusPill, Toggle, TypeIcon } from "./atoms";

interface PropertiesPanelProps {
  selectedStep: any;
  selectedId: any;
  setPlan: any;
  setSelectedId: any;
  setAddStepParentId: any;
  setShowAddStep: any;
  updateProperty: any;
}

export function PropertiesPanel({
  selectedStep,
  selectedId,
  setPlan,
  setSelectedId,
  setAddStepParentId,
  setShowAddStep,
  updateProperty,
}: PropertiesPanelProps) {
  const renderProperties = () => {
    if (!selectedStep) return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Sliders size={24} className="opacity-20" />
        <span className="text-[12px] font-mono">Select a step to inspect</span>
      </div>
    );

    const groups: string[] = Array.from(new Set((selectedStep.properties || []).map((p: any) => p.group as string)));
    const stripe = TYPE_STRIPE[selectedStep.type] || "#64748b";

    return (
      <div className="overflow-y-auto h-full">
        {/* Step identity */}
        <div className="border-b border-border" style={{ borderLeft: `3px solid ${stripe}` }}>
          <div className="px-3 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <TypeIcon type={selectedStep.type} size={14} />
              <span className="text-[13px] font-semibold text-foreground font-mono leading-tight">{selectedStep.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={selectedStep.status} />
              <span className="text-[11px] font-mono text-muted-foreground">{(selectedStep.type || "unknown").toUpperCase()}</span>
              {selectedStep.description && <span className="text-[11px] text-muted-foreground">· {selectedStep.description}</span>}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Enabled</span>
            <Toggle value={selectedStep.enabled} onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, enabled: !s.enabled })))} />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Breakpoint</span>
            <Toggle value={!!selectedStep.breakpoint} onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, breakpoint: !s.breakpoint })))} />
          </div>
        </div>

        {/* Properties by group */}
        {groups.map(group => (
          <div key={group}>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
              <div className="w-[3px] h-3" style={{ background: stripe }} />
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{group}</span>
            </div>
            {(selectedStep.properties || []).filter((p: any) => p.group === group).map((prop: any) => (
              <div key={prop.key} className="px-3 py-2.5 border-b border-border/40">
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wide">{prop.label}</label>
                {prop.type === "boolean" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono text-foreground">{prop.value ? "True" : "False"}</span>
                    <Toggle value={prop.value as boolean} onChange={() => updateProperty(selectedStep.id, prop.key, String(!prop.value))} />
                  </div>
                ) : prop.type === "enum" ? (
                  <select value={String(prop.value)} onChange={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                    className="w-full bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary">
                    {prop.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      key={`${selectedStep.id}-${prop.key}`}
                      defaultValue={prop.type === "frequency" ? formatFreq(prop.value as number) : String(prop.value)}
                      onBlur={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="flex-1 bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary min-w-0" />
                    {prop.unit && prop.type !== "frequency" && <span className="text-[11px] text-muted-foreground font-mono shrink-0">{prop.unit}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {selectedStep.properties && selectedStep.properties.length === 0 && <div className="px-3 py-4 text-[12px] text-muted-foreground font-mono">No configurable properties.</div>}

        <div className="px-3 py-3 border-t border-border flex gap-2 mt-1">
          <button onClick={() => { setAddStepParentId(null); setShowAddStep(true); }}
            className="flex-1 h-8 text-[12px] font-mono bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 border border-border transition-colors">
            <Plus size={11} /> Add Step
          </button>
          <button onClick={() => { if (selectedId) { setPlan((prev: any) => deleteIn(prev, selectedId)); setSelectedId(null); } }}
            className="flex-1 h-8 text-[12px] font-mono text-red-500 hover:bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    );

  };
  return renderProperties();

}
