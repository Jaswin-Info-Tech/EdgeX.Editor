import type { LibraryItem, StepStatus, TestStep } from "../types/editor";

let _uid = 100;
export const uid = () => `s${++_uid}`;

export function formatFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz} Hz`;
}

export function parseFreq(s: string): number {
  const n = parseFloat(s);
  if (s.toLowerCase().includes("ghz")) return n * 1e9;
  if (s.toLowerCase().includes("mhz")) return n * 1e6;
  if (s.toLowerCase().includes("khz")) return n * 1e3;
  return n || 0;
}

export function flatAll(steps: TestStep[]): TestStep[] {
  return steps.flatMap(s => [s, ...(s.children ? flatAll(s.children) : [])]);
}

export function hasAnySteps(steps: TestStep[]): boolean {
  return flatAll(steps).length > 0;
}

export function ensureUniqueStepIds(steps: TestStep[]): { steps: TestStep[]; changed: boolean } {
  const seen = new Set<string>();
  let changed = false;

  const visit = (items: TestStep[]): TestStep[] =>
    items.map((step) => {
      const rawId = String(step.id ?? "").trim();
      const nextId = rawId && !seen.has(rawId) ? rawId : uid();
      seen.add(nextId);

      const children = step.children ? visit(step.children) : undefined;
      const idChanged = nextId !== step.id;
      if (idChanged) changed = true;

      if (idChanged || children !== step.children) {
        return { ...step, id: nextId, children };
      }

      return step;
    });

  return { steps: visit(steps), changed };
}

export function updateIn(steps: TestStep[], id: string, fn: (s: TestStep) => TestStep): TestStep[] {
  let updated = false;

  const visit = (items: TestStep[]): TestStep[] =>
    items.map(s => {
      if (!updated && s.id === id) {
        updated = true;
        return fn(s);
      }

      return {
        ...s,
        children: s.children ? visit(s.children) : undefined,
      };
    });

  return visit(steps);
}

export function deleteIn(steps: TestStep[], id: string): TestStep[] {
  let deleted = false;

  const visit = (items: TestStep[]): TestStep[] =>
    items
      .filter(s => {
        if (!deleted && s.id === id) {
          deleted = true;
          return false;
        }
        return true;
      })
      .map(s => ({
        ...s,
        children: s.children ? visit(s.children) : undefined,
      }));

  return visit(steps);
}

export function moveIn(steps: TestStep[], id: string, dir: "up" | "down"): TestStep[] {
  const idx = steps.findIndex(s => s.id === id);
  if (idx !== -1) {
    const arr = [...steps];
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to >= 0 && to < arr.length) [arr[idx], arr[to]] = [arr[to], arr[idx]];
    return arr;
  }
  return steps.map(s => ({ ...s, children: s.children ? moveIn(s.children, id, dir) : undefined }));
}

export function addToParent(steps: TestStep[], parentId: string | null, step: TestStep, atIdx?: number): TestStep[] {
  if (!parentId) {
    if (atIdx !== undefined) { const a = [...steps]; a.splice(atIdx, 0, step); return a; }
    return [...steps, step];
  }
  return steps.map(s => {
    if (s.id === parentId) {
      const ch = [...(s.children || [])];
      atIdx !== undefined ? ch.splice(atIdx, 0, step) : ch.push(step);
      return { ...s, children: ch };
    }
    return { ...s, children: s.children ? addToParent(s.children, parentId, step, atIdx) : undefined };
  });
}

export function setStatusIn(steps: TestStep[], id: string, status: StepStatus): TestStep[] {
  return steps.map(s => ({
    ...s, status: s.id === id ? status : s.status,
    children: s.children ? setStatusIn(s.children, id, status) : undefined,
  }));
}

export function resetAll(steps: TestStep[]): TestStep[] {
  return steps.map(s => ({ ...s, status: "pending" as StepStatus, children: s.children ? resetAll(s.children) : undefined }));
}

export function makeStep(lib: LibraryItem): TestStep {
  const libRecord = lib as any;
  const canonicalStepTypeName =
    lib.fullName ??
    lib.typeName ??
    lib.className ??
    lib.stepTypeName ??
    libRecord.path ??
    libRecord.typePath ??
    lib.name;

  return {
    id: uid(),
    name: lib.name,
    type: lib.type,
    status: "pending",
    enabled: true,
    description: lib.description,
    properties: (lib.defaultProps || []).map(p => ({ ...p })),
    stepTypeName: canonicalStepTypeName,
    typeName: lib.typeName ?? canonicalStepTypeName,
    fullName: lib.fullName ?? canonicalStepTypeName,
    className: lib.className ?? canonicalStepTypeName,
  };
}

export function makeSequence(name = "New Sequence"): TestStep {
  return {
    id: uid(), name, type: "sequence", status: "pending", enabled: true, description: "Test sequence container",
    properties: [
      { key: "name", label: "Name", type: "string", value: name, group: "General" },
      { key: "verdict", label: "Verdict Logic", type: "enum", value: "AND", options: ["AND", "OR", "First"], group: "General" },
      { key: "break_on_fail", label: "Break on Fail", type: "boolean", value: true, group: "Execution" },
    ],
    children: [],
  };
}

export function nowTs() { return new Date().toISOString().slice(11, 23); }

export function toArray<T = any>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any)?.packages)) return (data as any).packages;
  if (Array.isArray((data as any)?.value)) return (data as any).value;
  return [];
}


export function moveStepToPosition(
  steps: TestStep[],
  stepId: string,
  newParentId: string | null,
  newIdx: number
): TestStep[] {
  let movedStep: TestStep | null = null;
  let oldParentId: string | null = null;
  let oldIdx = -1;

  const findLocation = (
    list: TestStep[],
    parentId: string | null = null,
  ): boolean => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === stepId) {
        oldParentId = parentId;
        oldIdx = i;
        return true;
      }

      if (list[i].children && findLocation(list[i].children!, list[i].id)) {
        return true;
      }
    }

    return false;
  };

  findLocation(steps);
  // Remove the step from wherever it currently lives, tracking it
  const removeStep = (list: TestStep[]): TestStep[] =>
    list
      .filter(step => {
        if (step.id === stepId) {
          movedStep = step;
          return false;
        }
        return true;
      })
      .map(step =>
        step.children
          ? { ...step, children: removeStep(step.children) }
          : step
      );

  const withoutMoved = removeStep(steps);
  if (!movedStep) return steps; // not found, no-op
  if (
    oldParentId === newParentId &&
    oldIdx !== -1 &&
    oldIdx < newIdx
  ) {
    newIdx--;
  }

  // Guard: don't allow dropping a sequence into its own descendant
  const isDescendant = (parentCandidateId: string | null, node: TestStep): boolean => {
    if (!parentCandidateId) return false;
    if (node.id === parentCandidateId) return true;
    return (node.children ?? []).some(child => isDescendant(parentCandidateId, child));
  };
  // Guard against cycles: don't allow a step into its own subtree
  if (movedStep && isDescendant(newParentId, movedStep)) {
    return steps; // would create a cycle, reject
  }

  const insertAt = (list: TestStep[]): TestStep[] => {
    if (newParentId === null) {
      const next = [...list];
      next.splice(newIdx, 0, movedStep!);
      return next;
    }
    return list.map(step => {
      if (step.id === newParentId) {
        const children = [...(step.children ?? [])];
        children.splice(newIdx, 0, movedStep!);
        return { ...step, children };
      }
      if (step.children) {
        return { ...step, children: insertAt(step.children) };
      }
      return step;
    });
  };

  return insertAt(withoutMoved);
}
