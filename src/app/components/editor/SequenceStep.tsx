import type { ReactNode } from "react";
import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  CopyPlus,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import type { TestStep } from "../../types/editor";
import { TYPE_LABEL, TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, formatFreq, moveIn, updateIn, addToParent, setStepEnabled, uid } from "../../utils/editor";
import { StatusIcon, StatusPill, TypeIcon } from "./atoms";

function canAcceptChildSteps(step: TestStep) {
  const rawTypeText = [
    step.stepTypeName,
    step.typeName,
    step.fullName,
    step.className,
    step.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    step.type === "sequence" ||
    Array.isArray(step.children) ||
    /sequence|dialog|parallel|if|lock|flow|group/.test(rawTypeText)
  );
}

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
  orderPath: string;
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
  setPlan: any;
  setAddStepParentId: any;
  setAddStepIdx: any;
  setShowAddStep: any;
  draggedStepId: string | null;
  setDraggedStepId: (id: string | null) => void;
  dropTarget: DropTarget | null;
  onStepDragStart: (stepId: string, e: React.MouseEvent) => void;
  onLibraryDragOverStep: (rowId: string, clientY: number, rowEl: HTMLElement) => void;
  onLibraryDropOnStep: (event: React.DragEvent, rowId: string, clientY: number, rowEl: HTMLElement) => void;
  onLibraryDragOverChildLane: (rowId: string) => void;
  onLibraryDropOnChildLane: (event: React.DragEvent, rowId: string) => void;
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
    orderPath,
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
    setPlan,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
    draggedStepId,
    dropTarget,
    onStepDragStart,
    onLibraryDragOverStep,
    onLibraryDropOnStep,
    onLibraryDragOverChildLane,
    onLibraryDropOnChildLane,
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
    const canHaveChildren = canAcceptChildSteps(step);

    const rowRef = useRef<HTMLDivElement>(null);

    const isBeingDragged = draggedStepId === step.id;
    const isAnyDragActive = !!dragLibItem;
    const isReorderDropBefore =
      dropTarget?.rowId === step.id && dropTarget.mode === "before";
    const isReorderDropAfter =
      dropTarget?.rowId === step.id && dropTarget.mode === "after";
    const isReorderDropInto =
      dropTarget?.rowId === step.id && dropTarget.mode === "into";
    const isActiveLibraryTarget = isAnyDragActive && dropTarget?.rowId === step.id;
    const showChildLane = canHaveChildren && isActiveLibraryTarget;

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

    return (
      <div key={step.id} ref={rowRef} data-step-row={step.id} className="relative">
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
            if (isAnyDragActive && rowRef.current) {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              onLibraryDragOverStep(step.id, e.clientY, rowRef.current);
            }
          }}
          onDrop={(e) => {
            if (isAnyDragActive && rowRef.current) {
              e.preventDefault();
              e.stopPropagation();
              onLibraryDropOnStep(e, step.id, e.clientY, rowRef.current);
            }
          }}
          data-step-status={step.status}
          className={`relative flex items-stretch border-b border-border cursor-pointer group transition-colors duration-300
            ${isSel ? "bg-primary/8" : "hover:bg-secondary/60"}
            ${isReorderDropInto ? "bg-primary/15 ring-1 ring-inset ring-primary" : ""}
            ${isBeingDragged ? "opacity-30" : ""}
            ${step.status === "running" ? "bg-yellow-500/15" : ""}
            ${step.status === "passed" ? "bg-emerald-500/15" : ""}
            ${step.status === "failed" ? "bg-red-500/15" : ""}
            ${step.status === "error" ? "bg-red-600/15" : ""}
            ${step.status === "skipped" ? "bg-muted/60" : ""}
            ${!step.enabled ? "opacity-40" : ""}`}
        >
          {isReorderDropBefore && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 -translate-y-1/2 px-2">
              <div className="flex items-center gap-2">
                <div className="h-[2px] flex-1 rounded-full bg-primary" />
                <span className="shrink-0 border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary shadow-sm">
                  Insert before
                </span>
              </div>
            </div>
          )}
          {isReorderDropInto && (
            <div className="pointer-events-none absolute inset-x-6 top-1 z-10 flex justify-center">
              <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary shadow-sm">
                Add as child
              </span>
            </div>
          )}
          <div
            className={`w-[3px] shrink-0 transition-colors duration-300 ${step.status === "running" ? "animate-pulse" : ""}`}
            style={{
              background:
                step.status === "running"
                  ? "#eab308"
                  : step.status === "passed"
                    ? "#10b981"
                    : step.status === "failed"
                      ? "#ef4444"
                      : step.status === "error"
                        ? "#dc2626"
                        : isSel
                          ? stripe
                          : stripe + "60",
            }}
          />

          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 min-w-0">
            {hasKids && (
              <button
                data-testid="expand-button"
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

            <span className={`shrink-0 border px-1.5 py-0 text-[10px] font-mono ${isSel ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
              {orderPath}
            </span>

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
              <div
                className="flex min-w-0 flex-1 items-center gap-2"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenaming(step.id);
                  setRenameVal(step.name);
                }}
              >
                <div
                  className={`min-w-0 flex-1 truncate text-[13px] font-mono ${isSel ? "text-foreground font-medium" : "text-foreground/80 group-hover:text-foreground"}`}
                >
                  {step.name}
                </div>
                {summary && (
                  <div className="shrink-0 truncate border border-border/60 bg-muted/20 px-1.5 py-0 text-[10px] font-mono text-muted-foreground">
                    {summary}
                  </div>
                )}
              </div>
            )}

            {/* Type label */}
            <span
              className="max-w-[96px] shrink truncate border px-1.5 py-0 text-[10px] font-mono"
              style={{ color: stripe, borderColor: stripe + "50" }}
              title={TYPE_LABEL[step.type] || "Unknown type"}
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
                setAddStepParentId(parentId);
                setAddStepIdx(idx + 1);
                setShowAddStep(true);
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="Add step after"
            >
              <Plus size={11} />
            </button>
            {canHaveChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddStepParentId(step.id);
                  setAddStepIdx(step.children?.length ?? 0);
                  setShowAddStep(true);
                }}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
                title="Add child step"
              >
                <Plus size={11} className="text-primary" />
              </button>
            )}
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
                const cloneRecursive = (s: TestStep): TestStep => ({
                  ...s,
                  id: uid(),
                  name: `${s.name} (copy)`,
                  status: "pending",
                  children: s.children ? s.children.map(c => cloneRecursive(c)) : undefined,
                });
                const clone = cloneRecursive(step);
                setPlan((prev: any) => addToParent(prev, parentId ?? null, clone, idx + 1));
                setSelectedId(clone.id);
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="Clone step"
            >
              <CopyPlus size={11} />
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
                  updateIn(prev, step.id, (s) => setStepEnabled(s, !s.enabled)),
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
          {isReorderDropAfter && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-1/2 px-2">
              <div className="flex items-center gap-2">
                <div className="h-[2px] flex-1 rounded-full bg-primary" />
                <span className="shrink-0 border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary shadow-sm">
                  Insert after
                </span>
              </div>
            </div>
          )}
        </div>
        {showChildLane && (
          <div
            data-child-drop-lane={step.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              onLibraryDragOverChildLane(step.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLibraryDropOnChildLane(e, step.id);
            }}
            className={`ml-6 border-b px-3 py-2 transition-all duration-150 ${isReorderDropInto
                ? "border-primary/40 bg-primary/10"
                : "border-transparent bg-transparent hover:border-primary/20 hover:bg-primary/[0.03]"
              }`}
          >
            <div
              className={`ml-3 flex items-center gap-2 border border-dashed px-3 py-2 ${isReorderDropInto
                  ? "border-primary/40 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]"
                  : "border-border/60 bg-muted/10"
                }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border/70 bg-background text-[10px] font-mono text-muted-foreground">
                +
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${isReorderDropInto ? "text-primary" : "text-muted-foreground"}`}>
                  {isReorderDropInto ? "Drop to add child step" : "Add child step"}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground/80">
                  Nested under {step.name}
                </div>
              </div>
            </div>
          </div>
        )}

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
                orderPath={`${orderPath}.${ci + 1}`}
              />
            ))}

          </div>
        )}
      </div>
    );
  };

  return renderSeqStep(step, parentId, idx);
}
