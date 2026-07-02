import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { FilePlus, GripVertical, Layers, Plus } from "lucide-react";
import { SequenceStep } from "./SequenceStep";
import { flatAll } from "../../utils/editor";

interface SequenceEditorProps {
  hasPlan: boolean;
  plan: any[];
  planMeta: any;
  stats: any;
  selectedId: string | null;
  setSelectedId: (value: string | null) => void;
  dragLibItem: any;
  dropIdx: number | null;
  setDropIdx: (value: number | null) => void;
  handleSeqDrop: (
    event: DragEvent,
    parentId: string | null,
    idx: number,
  ) => void;
  handleAddGroup: () => void;
  setShowNewPlan: (value: boolean) => void;
  setAddStepParentId: (value: string | null) => void;
  setAddStepIdx: (value: number | undefined) => void;
  setShowAddStep: (value: boolean) => void;
  sequenceStepProps: any;
  draggedStepId: string | null;
  handleStepReorder: (
    stepId: string,
    newParentId: string | null,
    newIdx: number,
  ) => void;
}

interface DropTarget {
  parentId: string | null;
  idx: number;
  mode: "before" | "after" | "into";
  rowId: string;
}

function flattenVisible(
  steps: any[],
  expanded: Set<string>,
  parentId: string | null = null,
  out: { id: string; parentId: string | null; idx: number }[] = [],
) {
  steps.forEach((step, idx) => {
    out.push({ id: step.id, parentId, idx });
    if (step.children?.length && expanded.has(step.id)) {
      flattenVisible(step.children, expanded, step.id, out);
    }
  });
  return out;
}

export function SequenceEditor({
  hasPlan,
  plan,
  planMeta,
  stats,
  selectedId,
  setSelectedId,
  dragLibItem,
  dropIdx,
  setDropIdx,
  handleSeqDrop,
  handleAddGroup,
  setShowNewPlan,
  setAddStepParentId,
  setAddStepIdx,
  setShowAddStep,
  sequenceStepProps,
  draggedStepId,
  handleStepReorder,
}: SequenceEditorProps) {
  const selectedStep = selectedId
    ? flatAll(plan).find((step) => step.id === selectedId)
    : null;
  const targetParentId = selectedStep ? selectedId : null;
  const targetIdx = selectedStep
    ? (selectedStep.children?.length ?? 0)
    : plan.length;

  const expanded: Set<string> = sequenceStepProps.expanded;
  const setDraggedStepId: (id: string | null) => void =
    sequenceStepProps.setDraggedStepId;

  const flatItems = useMemo(
    () => flattenVisible(plan, expanded),
    [plan, expanded],
  );

  const stepById = useMemo(() => {
    const map = new Map<string, any>();
    flatAll(plan).forEach((step) => map.set(step.id, step));
    return map;
  }, [plan]);

  const [activeDrag, setActiveDrag] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollSpeedRef = useRef(0);
  const autoScrollRafRef = useRef<number | null>(null);

  const excludedIds = useMemo(() => {
    if (!activeDrag) return new Set<string>();
    const node = stepById.get(activeDrag.id);
    if (!node) return new Set([activeDrag.id]);
    return new Set(flatAll([node]).map((s: any) => s.id));
  }, [activeDrag, stepById]);

  const startStepDrag = useCallback(
    (stepId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveDrag({ id: stepId, x: e.clientX, y: e.clientY });
      setDraggedStepId(stepId);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    },
    [setDraggedStepId],
  );

  useEffect(() => {
    if (!activeDrag) return;

    const tickAutoScroll = () => {
      if (autoScrollSpeedRef.current !== 0 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop += autoScrollSpeedRef.current;
      }
      autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
    };
    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);

    const handleMouseMove = (e: MouseEvent) => {
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`;
      }

      const el = document.elementFromPoint(
        e.clientX,
        e.clientY,
      ) as HTMLElement | null;
      const rowEl = el?.closest("[data-step-row]") as HTMLElement | null;
      const rowId = rowEl?.getAttribute("data-step-row") ?? null;

      if (rowId && !excludedIds.has(rowId)) {
        const item = flatItems.find((i) => i.id === rowId);
        const step = stepById.get(rowId);
        if (item && step && rowEl) {
          const rect = rowEl.getBoundingClientRect();
          const relY = (e.clientY - rect.top) / rect.height;
          const isSequence = step.type === "sequence";

          let next: DropTarget;
          if (isSequence) {
            if (relY < 0.25) {
              next = {
                parentId: item.parentId,
                idx: item.idx,
                mode: "before",
                rowId,
              };
            } else if (relY > 0.75) {
              next = {
                parentId: item.parentId,
                idx: item.idx + 1,
                mode: "after",
                rowId,
              };
            } else {
              next = {
                parentId: step.id,
                idx: step.children?.length ?? 0,
                mode: "into",
                rowId,
              };
            }
          } else {
            next =
              relY < 0.5
                ? {
                    parentId: item.parentId,
                    idx: item.idx,
                    mode: "before",
                    rowId,
                  }
                : {
                    parentId: item.parentId,
                    idx: item.idx + 1,
                    mode: "after",
                    rowId,
                  };
          }

          const prev = dropTargetRef.current;
          if (!prev || prev.rowId !== next.rowId || prev.mode !== next.mode) {
            dropTargetRef.current = next;
            setDropTarget(next);
          }
        }
      } else if (dropTargetRef.current !== null) {
        dropTargetRef.current = null;
        setDropTarget(null);
      }


      const container = scrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const edge = 56;
        const maxSpeed = 16;
        if (e.clientY < rect.top + edge) {
          const intensity = Math.min(1, (rect.top + edge - e.clientY) / edge);
          autoScrollSpeedRef.current = -maxSpeed * intensity;
        } else if (e.clientY > rect.bottom - edge) {
          const intensity = Math.min(
            1,
            (e.clientY - (rect.bottom - edge)) / edge,
          );
          autoScrollSpeedRef.current = maxSpeed * intensity;
        } else {
          autoScrollSpeedRef.current = 0;
        }
      }
    };

    const handleMouseUp = () => {
      const target = dropTargetRef.current;
      if (target) {
        handleStepReorder(activeDrag.id, target.parentId, target.idx);
      }
      autoScrollSpeedRef.current = 0;
      dropTargetRef.current = null;
      setDropTarget(null);
      setActiveDrag(null);
      setDraggedStepId(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (autoScrollRafRef.current)
        cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [
    activeDrag,
    excludedIds,
    flatItems,
    stepById,
    handleStepReorder,
    setDraggedStepId,
  ]);

  const handleBackgroundDrop = (e: any) => {
    e.stopPropagation();
    if (dragLibItem) {
      handleSeqDrop(e, targetParentId, targetIdx);
    }
  };

  const activeStepName = activeDrag ? stepById.get(activeDrag.id)?.name : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex items-center gap-2.5 px-4 h-9 border-b border-border bg-card shrink-0">
        <Layers size={14} className="text-primary shrink-0" />
        <span className="text-[12px] font-semibold text-foreground font-mono uppercase tracking-wider">
          Sequence Editor
        </span>
        {hasPlan && (
          <>
            <span className="text-muted-foreground text-[12px] font-mono">
              -
            </span>
            <span className="text-[12px] text-muted-foreground font-mono truncate">
              {planMeta.name}
            </span>
          </>
        )}
        {dragLibItem && (
          <span className="ml-auto text-[11px] font-mono text-primary animate-pulse">
            Drop to add: {dragLibItem.name}
          </span>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onClick={() => setSelectedId(null)}
        onDragOver={(e) => {
          if (dragLibItem) {
            e.preventDefault();
            e.stopPropagation();
            setDropIdx(targetIdx);
          }
        }}
        onDrop={handleBackgroundDrop}
      >
        {!hasPlan ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
            <div className="border-2 border-dashed border-border p-10 text-center w-full max-w-md">
              <FilePlus
                size={40}
                className="mx-auto text-muted-foreground/20 mb-4"
              />
              <div className="text-[14px] font-semibold text-foreground mb-1">
                No Test Plan Open
              </div>
              <div className="text-[12px] text-muted-foreground font-mono mb-5">
                Create a new plan or open an existing one.
              </div>
              <button
                onClick={() => setShowNewPlan(true)}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors"
              >
                Create New Test Plan
              </button>
            </div>
          </div>
        ) : plan.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-4 p-8"
            onDragOver={(e) => {
              if (dragLibItem) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              e.stopPropagation();
              if (dragLibItem) handleSeqDrop(e, null, 0);
            }}
          >
            <div className="border-2 border-dashed border-border p-10 text-center w-full max-w-lg">
              {" "}
              <Layers
                size={32}
                className="mx-auto text-muted-foreground/20 mb-4"
              />{" "}
              <div className="text-[13px] text-muted-foreground font-mono mb-4">
                Plan is empty - Drag and Drop a step to begin
              </div>{" "}
            </div>
          </div>
        ) : (
          <div>
            {plan.map((step, index) => (
              <SequenceStep
                key={step.id}
                {...sequenceStepProps}
                step={step}
                parentId={null}
                idx={index}
                draggedStepId={draggedStepId}
                dropTarget={dropTarget}
                onStepDragStart={startStepDrag}
              />
            ))}
            <button
              onClick={() => {
                setAddStepParentId(targetParentId);
                setAddStepIdx(targetIdx);
                setShowAddStep(true);
              }}
              className="w-full py-2 border-t border-dashed border-border/40 text-[12px] font-mono text-muted-foreground/50 hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={11} /> Add Test Step
            </button>
          </div>
        )}
      </div>

      {activeDrag && (
        <div
          ref={ghostRef}
          className="fixed top-0 left-0 z-[100] pointer-events-none flex items-center gap-2 px-3 py-2.5 bg-card border border-primary shadow-lg text-[13px] font-mono text-foreground"
          style={{
            transform: `translate(${activeDrag.x + 14}px, ${activeDrag.y + 12}px)`,
          }}
        >
          <GripVertical size={12} className="text-muted-foreground/50" />
          {activeStepName}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 h-7 border-t border-border bg-card text-[11px] font-mono text-muted-foreground shrink-0">
        {hasPlan ? (
          <>
            <span>
              Steps: <span className="text-foreground">{stats.total}</span>
            </span>
            <span>
              Enabled: <span className="text-foreground">{stats.enabled}</span>
            </span>
            <span className="text-emerald-500">{stats.passed} Pass</span>
            <span className="text-red-500">{stats.failed} Fail</span>
            {planMeta.dutName && (
              <span className="hidden lg:block ml-auto text-muted-foreground/60">
                DUT: {planMeta.dutName} {planMeta.dutSerial}
              </span>
            )}
          </>
        ) : (
          <span>No plan loaded</span>
        )}
      </div>
    </div>
  );
}
