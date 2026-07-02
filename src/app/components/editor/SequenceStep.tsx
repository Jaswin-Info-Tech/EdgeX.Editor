import type { ReactNode } from "react";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { TestStep } from "../../types/editor";
import { TYPE_LABEL, TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, formatFreq, moveIn, updateIn } from "../../utils/editor";
import { StatusIcon, StatusPill, TypeIcon } from "./atoms";

interface DropTarget {
  parentId: string | null;
  idx: number;
  mode: "before" | "after" | "into";
  rowId: string;
}

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
  dragOverSequenceId: string | null;
  setDragOverSequenceId: (id: string | null) => void;
  handleSeqDrop: any;
  setPlan: any;
  setAddStepParentId: any;
  setAddStepIdx: any;
  setShowAddStep: any;
  draggedStepId: string | null;
  setDraggedStepId: (id: string | null) => void;
  dropTarget: DropTarget | null;
  onStepDragStart: (stepId: string, e: React.MouseEvent) => void;
  handleStepReorder: (
    stepId: string,
    newParentId: string | null,
    newIdx: number,
  ) => void;
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
    dragOverSequenceId,
    setDragOverSequenceId,
    handleSeqDrop,
    setPlan,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
    draggedStepId,
    dropTarget,
    onStepDragStart,
  } = props;

  const renderSeqStep = (
    step: TestStep,
    parentId: string | null,
    idx: number,
  ): ReactNode => {
    const isSel = selectedId === step.id;
    const hasKids = !!step.children?.length;
    const isExp = expanded.has(step.id);
    const stripe = TYPE_STRIPE[step.type] || "#64748b";
    const isSequence = step.type === "sequence";

    const rowRef = useRef<HTMLDivElement>(null);

    const isBeingDragged = draggedStepId === step.id;
    const isAnyDragActive = !!dragLibItem;
    const isLibDropTargetRow =
      isSequence && isAnyDragActive && dragOverSequenceId === step.id;

    const isReorderDropBefore =
      dropTarget?.rowId === step.id && dropTarget.mode === "before";
    const isReorderDropAfter =
      dropTarget?.rowId === step.id && dropTarget.mode === "after";
    const isReorderDropInto =
      dropTarget?.rowId === step.id && dropTarget.mode === "into";

    const summaryProp =
      step.properties.find((p: any) => p.key?.includes("inst")) ??
      step.properties.find(
        (p: any) =>
          p.type === "frequency" || p.type === "number" || p.type === "string",
      );

    const value: any = summaryProp?.value;

    const summary =
      value && typeof value === "object"
        ? value.Name
        : summaryProp?.type === "frequency"
          ? formatFreq(value as number)
          : `${value ?? ""}${summaryProp?.unit ? ` ${summaryProp.unit}` : ""}`;

    const onLibDrop = (
      e: any,
      targetParentId: string | null,
      targetIdx: number,
    ) => {
      e.stopPropagation();
      if (dragLibItem) handleSeqDrop(e, targetParentId, targetIdx);
    };

    return (
      <div key={step.id} ref={rowRef} data-step-row={step.id}>
          <div
            className={`
        overflow-hidden
        transition-all
        duration-150
        ${isReorderDropBefore ? "h-8" : "h-0"}
    `}
          >
            <div className="h-[2px] bg-primary mt-3 rounded-full " />
          </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId((prev: string | null) =>
              prev === step.id ? null : step.id,
            );
            if (isTablet) setRightOpen(true);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id });
            setSelectedId(step.id);
          }}
          onDragOver={(e) => {
            if (isSequence && isAnyDragActive) {
              e.preventDefault();
              e.stopPropagation();
              setDragOverSequenceId(step.id);
            }
          }}
          onDragLeave={(e) => {
            if (isSequence && dragOverSequenceId === step.id) {
              e.stopPropagation();
              setDragOverSequenceId(null);
            }
          }}
          onDrop={(e) => {
            if (isSequence && isAnyDragActive) {
              e.preventDefault();
              onLibDrop(e, step.id, step.children?.length ?? 0);
              setDragOverSequenceId(null);
              setDropIdx(null);
            }
          }}
          className={`flex items-stretch border-b border-border cursor-pointer group transition-colors
            ${isSel ? "bg-primary/8" : "hover:bg-secondary/60"}
            ${isLibDropTargetRow || isReorderDropInto ? "bg-primary/15 ring-1 ring-inset ring-primary" : ""}
            ${isBeingDragged ? "opacity-30" : ""}
            ${step.status === "running" ? "bg-yellow-500/5" : ""}
            ${step.status === "passed" ? "bg-emerald-500/5" : ""}
            ${step.status === "failed" ? "bg-red-500/5" : ""}
            ${!step.enabled ? "opacity-40" : ""}`}
        >
          <div
            className="w-[3px] shrink-0 transition-colors"
            style={{
              background:
                isSel || step.status === "running"
                  ? stripe
                  : step.status === "passed"
                    ? "#10b981"
                    : step.status === "failed"
                      ? "#ef4444"
                      : stripe + "60",
            }}
          />

          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 min-w-0">
            {hasKids && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(step.id);
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onStepDragStart(step.id, e);
              }}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical
                size={12}
                className="text-muted-foreground/60 group-hover:text-muted-foreground shrink-0 h-5 w-5"
              />
            </div>
            <TypeIcon type={step.type} size={13} />

            {step.breakpoint && (
              <span
                className="w-2 h-2 bg-red-500 shrink-0"
                title="Breakpoint"
              />
            )}

            {renaming === step.id ? (
              <input
                ref={renameRef}
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-primary/10 border border-primary px-1.5 py-0 text-[13px] font-mono text-foreground outline-none"
              />
            ) : (
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[13px] font-mono truncate ${isSel ? "text-foreground font-medium" : "text-foreground/80 group-hover:text-foreground"}`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenaming(step.id);
                    setRenameVal(step.name);
                  }}
                >
                  {step.name}
                </div>
                {summary && (
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {summary}
                  </div>
                )}
              </div>
            )}

            {/* Type label */}
            <span
              className="text-[10px] font-mono border px-1.5 py-0 shrink-0"
              style={{ color: stripe, borderColor: stripe + "50" }}
            >
              {TYPE_LABEL[step.type] || "—"}
            </span>

            {!step.enabled && (
              <EyeOff size={11} className="text-muted-foreground shrink-0" />
            )}
            {step.status !== "pending" && <StatusPill status={step.status} />}
            <StatusIcon status={step.status} size={13} />
          </div>

          {/* Hover actions */}
          <div className="hidden group-hover:flex items-center px-1.5 gap-0.5 border-l border-border/50 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlan((prev: any) => moveIn(prev, step.id, "up"));
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowUp size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlan((prev: any) => moveIn(prev, step.id, "down"));
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowDown size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(step.id);
                setRenameVal(step.name);
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Edit3 size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlan((prev: any) =>
                  updateIn(prev, step.id, (s) => ({
                    ...s,
                    enabled: !s.enabled,
                  })),
                );
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              {step.enabled ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlan((prev: any) => deleteIn(prev, step.id));
                if (selectedId === step.id) setSelectedId(null);
              }}
              className="p-1 text-muted-foreground hover:text-red-500"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
          <div
            className={`
        overflow-hidden
        transition-all
        duration-150
        ${isReorderDropAfter ? "h-8" : "h-0"}
    `}
          >
            <div className="h-[2px] bg-primary mt-3 rounded-full" />
          </div>

        {/* Children */}
        {hasKids && isExp && (
          <div className="border-l-2 border-primary/20 ml-6">
            {step.children!.map((c, ci) => (
              <SequenceStep
                key={c.id}
                {...props}
                step={c}
                parentId={step.id}
                idx={ci}
              />
            ))}

          </div>
        )}
      </div>
    );
  };

  return renderSeqStep(step, parentId, idx);
}
