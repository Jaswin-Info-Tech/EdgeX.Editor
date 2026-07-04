import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ReactNode } from "react";

export function useDragResize(
  dir: "h" | "v",
  onDelta: (d: number) => void
) {
  const start = useRef(0);

  return useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();

      start.current = dir === "h" ? e.clientX : e.clientY;

      const move = (ev: globalThis.MouseEvent) => {
        const pos = dir === "h" ? ev.clientX : ev.clientY;
        onDelta(pos - start.current);
        start.current = pos;
      };

      const up = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    },
    [dir, onDelta]
  );
}

interface SplitterProps {
  onMouseDown: (e: ReactMouseEvent) => void;
  dir: "h" | "v";
  actionButton?: ReactNode;
}

export function Splitter({ onMouseDown, dir, actionButton }: SplitterProps) {
  const [hot, setHot] = useState(false);

  const down = (e: ReactMouseEvent) => {
    setHot(true);
    onMouseDown(e);
  };

  useEffect(() => {
    if (!hot) return;

    const up = () => setHot(false);

    document.addEventListener("mouseup", up);

    return () => {
      document.removeEventListener("mouseup", up);
    };
  }, [hot]);

  return (
    <div
      onMouseDown={down}
      className={`group relative shrink-0 z-10 transition-colors flex items-center justify-center
        ${
          dir === "h"
            ? "w-[4px] cursor-col-resize flex-col gap-1"
            : "h-[4px] cursor-row-resize flex-row gap-1"
        }
        ${hot ? "bg-primary/60" : "bg-border hover:bg-primary/40"}`}
    >
      {actionButton && (
        <div
          className={(dir === "h"
            ? "absolute -right-3 top-2 z-20"
            : "absolute right-2 -top-3 z-20") +
            " opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
          }
          onMouseDown={(e) => e.stopPropagation()}
        >
          {actionButton}
        </div>
      )}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-foreground/20 ${
            dir === "h" ? "w-[2px] h-5" : "h-[2px] w-5"
          }`}
        />
      ))}
    </div>
  );
}