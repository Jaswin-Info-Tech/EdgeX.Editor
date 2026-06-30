import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Edit3, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import type { TestStep } from "../../types/editor";
import { TYPE_LABEL, TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, formatFreq, moveIn, updateIn } from "../../utils/editor";
import { StatusIcon, StatusPill, TypeIcon } from "./atoms";

interface SequenceStepProps {
  step: TestStep;
  parentId: string | null;
  idx: number;
  selectedId: any;
  expanded: any;
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
  handleSeqDrop: any;
  setPlan: any;
  setAddStepParentId: any;
  setAddStepIdx: any;
  setShowAddStep: any;
}

export function SequenceStep(props: SequenceStepProps) {
  const {
    step,
    parentId,
    idx,
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
    handleSeqDrop,
    setPlan,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
  } = props;
  const renderSeqStep = (step: TestStep, parentId: string | null, idx: number): ReactNode => {
    const isSel = selectedId === step.id;
    const hasKids = !!step.children?.length;
    const isExp = expanded.has(step.id);
    const stripe = TYPE_STRIPE[step.type] || "#64748b";
    const summaryProp =
      step.properties.find((p: any) => p.key?.includes("inst")) ??
      step.properties.find(
        (p: any) =>
          p.type === "frequency" ||
          p.type === "number" ||
          p.type === "string"
      );

    const value: any = summaryProp?.value;

    const summary =
      value && typeof value === "object"
        ? value.Name
        : summaryProp?.type === "frequency"
          ? formatFreq(value as number)
          : `${value ?? ""}${summaryProp?.unit ? ` ${summaryProp.unit}` : ""}`;

    return (
      <div key={step.id}>
        {dragLibItem && (
          <div onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropIdx(idx); }} onDrop={e => { e.stopPropagation(); handleSeqDrop(e, parentId, idx); }}
            className={`h-1 transition-colors mx-1 mb-0.5 ${dropIdx === idx ? "bg-primary" : "bg-transparent"}`} />
        )}
        <div
          onClick={e => {
            e.stopPropagation();
            console.log("SequenceStep click", step.id, step.name); setSelectedId(step.id); if (isTablet) setRightOpen(true);
          }}
          onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id }); setSelectedId(step.id); }}
          className={`flex items-stretch border-b border-border cursor-pointer group transition-colors
            ${isSel ? "bg-primary/8" : "hover:bg-secondary/60"}
            ${step.status === "running" ? "bg-yellow-500/5" : ""}
            ${step.status === "passed" ? "bg-emerald-500/5" : ""}
            ${step.status === "failed" ? "bg-red-500/5" : ""}
            ${!step.enabled ? "opacity-40" : ""}`}
        >
          {/* Left type stripe */}
          <div className="w-[3px] shrink-0 transition-colors" style={{ background: isSel || step.status === "running" ? stripe : step.status === "passed" ? "#10b981" : step.status === "failed" ? "#ef4444" : stripe + "60" }} />

          {/* Content */}
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 min-w-0">
            {hasKids && (
              <button onClick={e => { e.stopPropagation(); toggleExpand(step.id); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
            <GripVertical size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 cursor-grab" />
            <TypeIcon type={step.type} size={13} />
            {step.breakpoint && <span className="w-2 h-2 bg-red-500 shrink-0" title="Breakpoint" />}

            {renaming === step.id ? (
              <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
                onBlur={commitRename} onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-primary/10 border border-primary px-1.5 py-0 text-[13px] font-mono text-foreground outline-none" />
            ) : (
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-mono truncate ${isSel ? "text-foreground font-medium" : "text-foreground/80 group-hover:text-foreground"}`}
                  onDoubleClick={e => { e.stopPropagation(); setRenaming(step.id); setRenameVal(step.name); }}>
                  {step.name}
                </div>
                {summary && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{summary}</div>}
              </div>
            )}

            {/* Type label */}
            <span className="text-[10px] font-mono border px-1.5 py-0 shrink-0" style={{ color: stripe, borderColor: stripe + "50" }}>
              {TYPE_LABEL[step.type] || "—"}
            </span>

            {!step.enabled && <EyeOff size={11} className="text-muted-foreground shrink-0" />}
            {step.status !== "pending" && <StatusPill status={step.status} />}
            <StatusIcon status={step.status} size={13} />
          </div>

          {/* Hover actions */}
          <div className="hidden group-hover:flex items-center px-1.5 gap-0.5 border-l border-border/50 shrink-0">
            <button onClick={e => { e.stopPropagation(); setPlan((prev: any) => moveIn(prev, step.id, "up")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowUp size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setPlan((prev: any) => moveIn(prev, step.id, "down")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowDown size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setRenaming(step.id); setRenameVal(step.name); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><Edit3 size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setPlan((prev: any) => updateIn(prev, step.id, s => ({ ...s, enabled: !s.enabled }))); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary">{step.enabled ? <Eye size={11} /> : <EyeOff size={11} />}</button>
            <button onClick={e => { e.stopPropagation(); setPlan((prev: any) => deleteIn(prev, step.id)); if (selectedId === step.id) setSelectedId(null); }} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 size={11} /></button>
          </div>
        </div>

        {/* Children */}
        {hasKids && isExp && (
          <div className="border-l-2 border-primary/20 ml-6">
            {step.children!.map((c, ci) => <SequenceStep key={c.id} {...props} step={c} parentId={step.id} idx={ci} />)}
            {dragLibItem && (
              <div onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropIdx(-1); }} onDrop={e => { e.stopPropagation(); handleSeqDrop(e, step.id, step.children!.length); }}
                className={`h-8 flex items-center justify-center text-[11px] font-mono border border-dashed transition-colors m-1
                  ${dropIdx === -1 ? "border-primary text-primary bg-primary/5" : "border-border/50 text-muted-foreground/40"}`}>
                + Drop into {step.name}
              </div>
            )}
            <button onClick={() => { setAddStepParentId(step.id); setAddStepIdx(undefined); setShowAddStep(true); }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-mono text-muted-foreground/50 hover:text-primary hover:bg-primary/5 flex items-center gap-1.5 transition-colors border-b border-border/30">
              <Plus size={10} /> Add step inside {step.name}
            </button>
          </div>
        )}
      </div>
    );
  };

  return renderSeqStep(step, parentId, idx);

}
