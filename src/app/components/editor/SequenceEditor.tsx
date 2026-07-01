import type { DragEvent } from "react";
import { FilePlus, FolderPlus, Layers, Plus } from "lucide-react";
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
  handleSeqDrop: (event: DragEvent, parentId: string | null, idx: number) => void;
  handleAddGroup: () => void;
  setShowNewPlan: (value: boolean) => void;
  setAddStepParentId: (value: string | null) => void;
  setAddStepIdx: (value: number | undefined) => void;
  setShowAddStep: (value: boolean) => void;
  sequenceStepProps: any;
  draggedStepId: string | null;
  handleStepReorder: (stepId: string, newParentId: string | null, newIdx: number) => void;
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
  draggedStepId,
  handleStepReorder,
  sequenceStepProps,
}: SequenceEditorProps) {
  const selectedStep = selectedId ? flatAll(plan).find(step => step.id === selectedId) : null;
  const targetParentId = selectedStep ? selectedId : null;
  const targetIdx = selectedStep ? (selectedStep.children?.length ?? 0) : plan.length;
  const isAnyDragActive = !!dragLibItem || !!draggedStepId;

  const handleBackgroundDrop = (e: any) => {
    e.stopPropagation();
    if (draggedStepId) {
      handleStepReorder(draggedStepId, targetParentId, targetIdx);
    } else if (dragLibItem) {
      handleSeqDrop(e, targetParentId, targetIdx);
    }
  };

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
        {/* ...rest unchanged... */}
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
              {" "}
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
              />
            ))}
            {dragLibItem && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropIdx(targetIdx);
                }}
                onDrop={e => { e.stopPropagation(); handleSeqDrop(e, targetParentId, targetIdx); }}
                className={`h-12 flex items-center justify-center text-[12px] font-mono border border-dashed m-3 transition-colors
                  ${dropIdx === targetIdx ? "border-primary text-primary bg-primary/5" : "border-border/40 text-muted-foreground/30"}`}
              >
                {selectedStep ? `+ Drop here to add into "${selectedStep.name}"` : "+ Drop here to append"}
              </div>
            )}
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

      {isAnyDragActive && (
        <div
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropIdx(targetIdx); }}
          onDrop={handleBackgroundDrop}
          className={`h-12 flex items-center justify-center text-[12px] font-mono border border-dashed m-3 transition-colors
              ${dropIdx === targetIdx ? "border-primary text-primary bg-primary/5" : "border-border/40 text-muted-foreground/30"}`}
        >
          {selectedStep ? `+ Drop here to add into "${selectedStep.name}"` : "+ Drop here to append"}
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
