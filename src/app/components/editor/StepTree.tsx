import { ChevronDown, ChevronRight, EyeOff } from "lucide-react";
import { TYPE_STRIPE } from "../../constants/editor";
import type { TestStep } from "../../types/editor";
import { StatusIcon } from "./atoms";

interface StepTreeProps {
  step: TestStep;
  depth?: number;
  selectedId: string | null;
  expanded: Set<string>;
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

export function StepTree(props: StepTreeProps) {
  const {
    step,
    depth = 0,
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
  } = props;

  const isSel = selectedId === step.id;
  const isExp = expanded.has(step.id);
  const hasKids = !!step.children?.length;
  const stripe = TYPE_STRIPE[step.type] || "#64748b";

  return (
    <div>
      {renaming === step.id ? (
        <div className="px-3 py-1" style={{ paddingLeft: 12 + depth * 14 }}>
          <input
            ref={renameRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(null);
            }}
            className="w-full bg-primary/10 border border-primary px-2 py-0.5 text-[12px] font-mono text-foreground outline-none"
          />
        </div>
      ) : (
        <div
          onClick={() => setSelectedId(step.id)}
          onContextMenu={e => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id });
            setSelectedId(step.id);
          }}
          className={`flex items-center gap-1.5 py-1 cursor-pointer select-none group transition-colors
            ${isSel ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-secondary"}
            ${!step.enabled ? "opacity-40" : ""}`}
          style={{ paddingLeft: 10 + depth * 14, paddingRight: 8 }}
        >
          <button
            onClick={e => {
              e.stopPropagation();
              if (hasKids) toggleExpand(step.id);
            }}
            className="w-3 shrink-0 text-muted-foreground"
          >
            {hasKids ? (isExp ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : null}
          </button>
          <div className="w-[3px] h-3.5 shrink-0" style={{ background: stripe }} />
          {step.breakpoint && <span className="w-2 h-2 bg-red-500 shrink-0" />}
          <span className={`flex-1 truncate text-[12px] font-mono ${isSel ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {step.name}
          </span>
          {!step.enabled && <EyeOff size={9} className="text-muted-foreground shrink-0" />}
          <StatusIcon status={step.status} size={11} />
        </div>
      )}
      {hasKids && isExp && step.children!.map(child => (
        <StepTree key={child.id} {...props} step={child} depth={depth + 1} />
      ))}
    </div>
  );
}
