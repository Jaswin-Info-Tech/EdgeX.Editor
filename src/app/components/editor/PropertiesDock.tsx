import { ArrowDown, ArrowUp, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { moveIn } from "../../utils/editor";
import { PanelHeader } from "./atoms";
import { Splitter } from "./resizable";

interface PropertiesDockProps {
  isTablet: boolean;
  rightOpen: boolean;
  setRightOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  selectedStep: any;
  selectedId: string | null;
  setPlan: (updater: any) => void;
  rightW: number;
  dragRight: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function PropertiesDock({
  isTablet,
  rightOpen,
  setRightOpen,
  selectedStep,
  selectedId,
  setPlan,
  rightW,
  dragRight,
  children,
}: PropertiesDockProps) {
  if (isTablet) {
    if (!rightOpen) return null;

    return (
      <div className="absolute inset-0 z-40" onClick={() => setRightOpen(false)}>
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border flex flex-col shadow-2xl z-50" onClick={e => e.stopPropagation()}>
          <PanelHeader icon={<SlidersHorizontal size={13} />} label="Properties">
            <button onClick={() => setRightOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
          </PanelHeader>
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Splitter dir="h" onMouseDown={dragRight} />
      <div className="shrink-0 flex flex-col border-l border-border bg-card overflow-hidden" style={{ width: rightW }}>
        <PanelHeader icon={<SlidersHorizontal size={13} />} label="Properties">
          {selectedStep && (
            <>
              <button onClick={() => { if (selectedId) setPlan((prev: any) => moveIn(prev, selectedId, "up")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowUp size={11} /></button>
              <button onClick={() => { if (selectedId) setPlan((prev: any) => moveIn(prev, selectedId, "down")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowDown size={11} /></button>
            </>
          )}
          <button
            onClick={() => setRightOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Collapse properties"
          >
            <ChevronRight size={11} />
          </button>
        </PanelHeader>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
