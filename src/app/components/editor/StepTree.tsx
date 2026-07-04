import { ChevronDown, ChevronRight, EyeOff } from "lucide-react";
import { TYPE_STRIPE } from "../../constants/editor";
import type { TestStep } from "../../types/editor";
import { StatusIcon } from "./atoms";

interface StepTreeProps {
  step: TestStep;
  depth?: number;
  isLast?: boolean;
  ancestorHasNext?: boolean[];
  orderPath?: string;
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
    isLast = true,
    ancestorHasNext = [],
    orderPath = "1",
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
  const branchColumn = 18;
  const indent = 14 + depth * branchColumn;
  const currentBranchX = 10 + (depth - 1) * branchColumn;

  const branchGuides = depth > 0 ? (
    <>
      {ancestorHasNext.map((hasNext, index) => {
        if (!hasNext) return null;
        return (
          <div
            key={`ancestor-${index}`}
            className="pointer-events-none absolute bottom-0 top-0 w-px bg-border/80"
            style={{ left: 10 + index * branchColumn }}
          />
        );
      })}
      <div
        className="pointer-events-none absolute w-px bg-border/80"
        style={{
          left: currentBranchX,
          top: 0,
          bottom: isLast ? "50%" : 0,
        }}
      />
      <div
        className="pointer-events-none absolute h-px bg-border/80"
        style={{ left: currentBranchX, top: "50%", width: 12 }}
      />
    </>
  ) : null;

  return (
    <div className="relative">
      {renaming === step.id ? (
        <div className="relative px-3 py-1" style={{ paddingLeft: indent }}>
          {branchGuides}
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
          className={`relative mx-1 my-0.5 flex items-center gap-1.5 rounded-sm py-1.5 cursor-pointer select-none group transition-colors
            ${isSel ? "bg-primary/10 border-l-2 border-primary shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]" : "border-l-2 border-transparent hover:bg-secondary/55"}
            ${!step.enabled ? "opacity-40" : ""}`}
          style={{ paddingLeft: indent, paddingRight: 8 }}
        >
          {branchGuides}
          <button
            onClick={e => {
              e.stopPropagation();
              if (hasKids) toggleExpand(step.id);
            }}
            className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            {hasKids ? (isExp ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : null}
          </button>
          <div className="relative z-10 w-[3px] h-3.5 shrink-0 rounded-full" style={{ background: stripe }} />
          <span className={`relative z-10 shrink-0 border px-1.5 py-0 text-[10px] font-mono ${isSel ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
            {orderPath}
          </span>
          {step.breakpoint && <span className="w-2 h-2 bg-red-500 shrink-0" />}
          <span className={`relative z-10 flex-1 truncate text-[12px] font-mono ${isSel ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
            {step.name}
          </span>
          {!step.enabled && <EyeOff size={9} className="relative z-10 text-muted-foreground shrink-0" />}
          <StatusIcon status={step.status} size={11} />
        </div>
      )}
      {hasKids && isExp && (
        <div className="relative">
          {step.children!.map((child, index) => (
            <StepTree
              key={child.id}
              {...props}
              step={child}
              depth={depth + 1}
              isLast={index === step.children!.length - 1}
              ancestorHasNext={[...ancestorHasNext, !isLast]}
              orderPath={`${orderPath}.${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
