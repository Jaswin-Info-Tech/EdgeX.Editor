/**
 * Test suite for the step/tree helper module (uid, formatFreq, parseFreq,
 * flatAll, updateIn, deleteIn, moveIn, addToParent, setStatusIn, resetAll,
 * makeStep, makeSequence, nowTs, toArray, moveStepToPosition).
 *
 * Written for Vitest (`npm i -D vitest` and add a "test": "vitest" script).
 * It also runs unchanged under Jest — just swap the `vitest` import for
 * `@jest/globals` (or nothing, if Jest globals are enabled).
 *
 * Adjust the import path below to point at the actual module location
 * (assumed here to be a sibling file "./helpers").
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  uid,
  formatFreq,
  parseFreq,
  flatAll,
  updateIn,
  deleteIn,
  moveIn,
  addToParent,
  setStatusIn,
  resetAll,
  makeStep,
  makeSequence,
  nowTs,
  toArray,
  moveStepToPosition,
  setStepEnabled,
  normalizeOpenTapEnabledValue,
} from "./editor";
import type { LibraryItem, TestStep } from "../types/editor";

describe("setStepEnabled", () => {
  it("keeps the step flag and Enabled property synchronized", () => {
    const step = {
      id: "step-1",
      name: "Step",
      type: "action",
      status: "pending",
      enabled: true,
      properties: [
        {
          key: "Enabled || Enabled",
          label: "Enabled",
          type: "boolean",
          value: true,
          group: "General",
        },
      ],
    } satisfies TestStep;

    const disabledStep = setStepEnabled(step, false);

    expect(disabledStep.enabled).toBe(false);
    expect(disabledStep.properties[0].value).toBe(false);
    expect(step.enabled).toBe(true);
  });
});

describe("normalizeOpenTapEnabledValue", () => {
  const enabledStringType = "OpenTap.Enabled`1[[System.String, System.Private.CoreLib]]";

  it("preserves an enabled expression returned as display text", () => {
    expect(normalizeOpenTapEnabledValue(enabledStringType, "^\\s*1\\s*$")).toEqual({
      Value: "^\\s*1\\s*$",
      IsEnabled: true,
    });
  });

  it("preserves a disabled expression returned with the disabled suffix", () => {
    expect(normalizeOpenTapEnabledValue(enabledStringType, ".* (disabled)")).toEqual({
      Value: ".*",
      IsEnabled: false,
    });
  });

  it("normalizes an existing wrapper object", () => {
    expect(normalizeOpenTapEnabledValue(enabledStringType, {
      Value: "result",
      IsEnabled: true,
    })).toEqual({
      Value: "result",
      IsEnabled: true,
    });
  });

  it("does not alter ordinary property values", () => {
    expect(normalizeOpenTapEnabledValue("System.String", "text")).toBe("text");
  });
});

// ---------------------------------------------------------------------------
// Fixtures / helpers
// ---------------------------------------------------------------------------

function leaf(id: string, overrides: Partial<TestStep> = {}): TestStep {
  return {
    id,
    name: id,
    type: "action",
    status: "pending",
    enabled: true,
    properties: [],
    ...overrides,
  } as TestStep;
}

function seq(id: string, children: TestStep[] = [], overrides: Partial<TestStep> = {}): TestStep {
  return {
    id,
    name: id,
    type: "sequence",
    status: "pending",
    enabled: true,
    properties: [],
    children,
    ...overrides,
  } as TestStep;
}

/** Builds:
 * root
 *   A (leaf)
 *   B (sequence)
 *     B1 (leaf)
 *     B2 (sequence)
 *       B2a (leaf)
 *   C (leaf)
 */
function buildTree(): TestStep[] {
  return [
    leaf("A"),
    seq("B", [leaf("B1"), seq("B2", [leaf("B2a")])]),
    leaf("C"),
  ];
}

function findNode(steps: TestStep[], id: string): TestStep | undefined {
  for (const s of steps) {
    if (s.id === id) return s;
    if (s.children) {
      const found = findNode(s.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function idPath(steps: TestStep[]): string[] {
  return steps.map(s => s.id);
}

// ---------------------------------------------------------------------------
// uid
// ---------------------------------------------------------------------------

describe("uid", () => {
  it("returns a string prefixed with 's'", () => {
    expect(uid()).toMatch(/^s\d+$/);
  });

  it("never repeats a value across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = uid();
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });
});

// ---------------------------------------------------------------------------
// formatFreq
// ---------------------------------------------------------------------------

describe("formatFreq", () => {
  it("formats sub-kHz values as plain Hz", () => {
    expect(formatFreq(500)).toBe("500 Hz");
    expect(formatFreq(0)).toBe("0 Hz");
  });

  it("formats kHz range with 3 decimals", () => {
    expect(formatFreq(1_000)).toBe("1.000 kHz");
    expect(formatFreq(12_345)).toBe("12.345 kHz");
  });

  it("formats MHz range with 3 decimals", () => {
    expect(formatFreq(2_450_000)).toBe("2.450 MHz");
  });

  it("formats GHz range with 3 decimals", () => {
    expect(formatFreq(5_800_000_000)).toBe("5.800 GHz");
  });

  it("respects boundary values (>= not >)", () => {
    expect(formatFreq(1e3)).toBe("1.000 kHz");
    expect(formatFreq(1e6)).toBe("1.000 MHz");
    expect(formatFreq(1e9)).toBe("1.000 GHz");
  });
});

// ---------------------------------------------------------------------------
// parseFreq
// ---------------------------------------------------------------------------

describe("parseFreq", () => {
  it("parses GHz strings", () => {
    expect(parseFreq("2.4 GHz")).toBeCloseTo(2.4e9);
  });

  it("parses MHz strings case-insensitively", () => {
    expect(parseFreq("915 mhz")).toBeCloseTo(915e6);
  });

  it("parses kHz strings", () => {
    expect(parseFreq("100 kHz")).toBeCloseTo(100e3);
  });

  it("treats a bare number as Hz", () => {
    expect(parseFreq("42")).toBe(42);
  });

  it("returns 0 for unparseable input", () => {
    expect(parseFreq("not a number")).toBe(0);
  });

  it("handles leading numeric text before the unit", () => {
    expect(parseFreq("3.5GHz")).toBeCloseTo(3.5e9);
  });
});

// ---------------------------------------------------------------------------
// flatAll
// ---------------------------------------------------------------------------

describe("flatAll", () => {
  it("flattens a nested tree into a single array, parents before children", () => {
    const tree = buildTree();
    const flat = flatAll(tree);
    expect(idPath(flat)).toEqual(["A", "B", "B1", "B2", "B2a", "C"]);
  });

  it("returns an empty array for an empty tree", () => {
    expect(flatAll([])).toEqual([]);
  });

  it("handles a flat (no children) list", () => {
    const flat = flatAll([leaf("A"), leaf("B")]);
    expect(idPath(flat)).toEqual(["A", "B"]);
  });
});

// ---------------------------------------------------------------------------
// updateIn
// ---------------------------------------------------------------------------

describe("updateIn", () => {
  it("updates a top-level node", () => {
    const tree = buildTree();
    const updated = updateIn(tree, "A", s => ({ ...s, name: "Renamed" }));
    expect(findNode(updated, "A")?.name).toBe("Renamed");
  });

  it("updates a deeply nested node", () => {
    const tree = buildTree();
    const updated = updateIn(tree, "B2a", s => ({ ...s, status: "passed" }));
    expect(findNode(updated, "B2a")?.status).toBe("passed");
  });

  it("does not mutate the original tree", () => {
    const tree = buildTree();
    updateIn(tree, "A", s => ({ ...s, name: "Renamed" }));
    expect(findNode(tree, "A")?.name).toBe("A");
  });

  it("is a no-op (structurally) when the id is not found", () => {
    const tree = buildTree();
    const updated = updateIn(tree, "does-not-exist", s => ({ ...s, name: "X" }));
    expect(idPath(flatAll(updated))).toEqual(idPath(flatAll(tree)));
  });
});

// ---------------------------------------------------------------------------
// deleteIn
// ---------------------------------------------------------------------------

describe("deleteIn", () => {
  it("removes a top-level leaf", () => {
    const tree = buildTree();
    const result = deleteIn(tree, "A");
    expect(findNode(result, "A")).toBeUndefined();
    expect(idPath(result)).toEqual(["B", "C"]);
  });

  it("removes a nested node without disturbing siblings", () => {
    const tree = buildTree();
    const result = deleteIn(tree, "B1");
    const b = findNode(result, "B");
    expect(findNode(result, "B1")).toBeUndefined();
    expect(b?.children?.map(c => c.id)).toEqual(["B2"]);
  });

  it("removing a sequence removes its whole subtree", () => {
    const tree = buildTree();
    const result = deleteIn(tree, "B2");
    const b = findNode(result, "B");
    expect(findNode(result, "B2a")).toBeUndefined();
    expect(b?.children?.map(c => c.id)).toEqual(["B1"]);
  });

  it("is a no-op when id is not found", () => {
    const tree = buildTree();
    const result = deleteIn(tree, "nope");
    expect(idPath(flatAll(result))).toEqual(idPath(flatAll(tree)));
  });
});

// ---------------------------------------------------------------------------
// moveIn
// ---------------------------------------------------------------------------

describe("moveIn", () => {
  it("moves a top-level item up", () => {
    const tree = [leaf("A"), leaf("B"), leaf("C")];
    const result = moveIn(tree, "B", "up");
    expect(idPath(result)).toEqual(["B", "A", "C"]);
  });

  it("moves a top-level item down", () => {
    const tree = [leaf("A"), leaf("B"), leaf("C")];
    const result = moveIn(tree, "B", "down");
    expect(idPath(result)).toEqual(["A", "C", "B"]);
  });

  it("does nothing when moving the first item up", () => {
    const tree = [leaf("A"), leaf("B")];
    const result = moveIn(tree, "A", "up");
    expect(idPath(result)).toEqual(["A", "B"]);
  });

  it("does nothing when moving the last item down", () => {
    const tree = [leaf("A"), leaf("B")];
    const result = moveIn(tree, "B", "down");
    expect(idPath(result)).toEqual(["A", "B"]);
  });

  it("moves within a nested children array", () => {
    const tree = seq("root", [leaf("X"), leaf("Y")]);
    const result = moveIn([tree], "Y", "up");
    expect(result[0].children?.map(c => c.id)).toEqual(["Y", "X"]);
  });
});

// ---------------------------------------------------------------------------
// addToParent
// ---------------------------------------------------------------------------

describe("addToParent", () => {
  it("appends to the root when parentId is null", () => {
    const tree = [leaf("A")];
    const result = addToParent(tree, null, leaf("New"));
    expect(idPath(result)).toEqual(["A", "New"]);
  });

  it("inserts at a specific index at root level", () => {
    const tree = [leaf("A"), leaf("B")];
    const result = addToParent(tree, null, leaf("New"), 1);
    expect(idPath(result)).toEqual(["A", "New", "B"]);
  });

  it("appends into a named parent's children", () => {
    const tree = [seq("B", [leaf("B1")])];
    const result = addToParent(tree, "B", leaf("New"));
    expect(result[0].children?.map(c => c.id)).toEqual(["B1", "New"]);
  });

  it("inserts at a specific index inside a parent", () => {
    const tree = [seq("B", [leaf("B1"), leaf("B2")])];
    const result = addToParent(tree, "B", leaf("New"), 1);
    expect(result[0].children?.map(c => c.id)).toEqual(["B1", "New", "B2"]);
  });

  it("initializes children array when parent had none", () => {
    const tree = [leaf("Leafy")];
    // Leafy has no children array defined; addToParent should create one.
    const result = addToParent(tree as any, "Leafy", leaf("New"));
    expect(findNode(result, "Leafy")?.children?.map(c => c.id)).toEqual(["New"]);
  });
});

// ---------------------------------------------------------------------------
// setStatusIn
// ---------------------------------------------------------------------------

describe("setStatusIn", () => {
  it("sets status on the matching node only", () => {
    const tree = buildTree();
    const result = setStatusIn(tree, "B1", "failed");
    expect(findNode(result, "B1")?.status).toBe("failed");
    expect(findNode(result, "A")?.status).toBe("pending");
    expect(findNode(result, "B")?.status).toBe("pending");
  });

  it("sets status on a deeply nested node", () => {
    const tree = buildTree();
    const result = setStatusIn(tree, "B2a", "running");
    expect(findNode(result, "B2a")?.status).toBe("running");
  });
});

// ---------------------------------------------------------------------------
// resetAll
// ---------------------------------------------------------------------------

describe("resetAll", () => {
  it("resets every node (including nested) to pending", () => {
    let tree = buildTree();
    tree = setStatusIn(tree, "A", "passed");
    tree = setStatusIn(tree, "B2a", "failed");
    const result = resetAll(tree);
    for (const s of flatAll(result)) {
      expect(s.status).toBe("pending");
    }
  });
});

// ---------------------------------------------------------------------------
// makeStep
// ---------------------------------------------------------------------------

describe("makeStep", () => {
  it("builds a step from a library item using fullName when present", () => {
    const lib: LibraryItem = {
      name: "Set Voltage",
      type: "action",
      fullName: "NI.Instr.SetVoltage",
      description: "Sets output voltage",
      defaultProps: [{ key: "value", label: "Value", type: "number", value: 0, group: "General" }],
    } as any;

    const step = makeStep(lib);
    expect(step.name).toBe("Set Voltage");
    expect(step.status).toBe("pending");
    expect(step.enabled).toBe(true);
    expect(step.stepTypeName).toBe("NI.Instr.SetVoltage");
    expect(step.typeName).toBe("NI.Instr.SetVoltage");
    expect(step.fullName).toBe("NI.Instr.SetVoltage");
    expect(step.className).toBe("NI.Instr.SetVoltage");
    expect(step.properties).toEqual(lib.defaultProps);
  });

  it("falls back through typeName / className / stepTypeName / path / typePath / name in order", () => {
    const libTypeName: LibraryItem = { name: "X", type: "action", typeName: "Type.X" } as any;
    expect(makeStep(libTypeName).stepTypeName).toBe("Type.X");

    const libClassName: LibraryItem = { name: "X", type: "action", className: "Class.X" } as any;
    expect(makeStep(libClassName).stepTypeName).toBe("Class.X");

    const libStepTypeName: LibraryItem = { name: "X", type: "action", stepTypeName: "Step.X" } as any;
    expect(makeStep(libStepTypeName).stepTypeName).toBe("Step.X");

    const libPath: LibraryItem = { name: "X", type: "action", path: "path/to/x" } as any;
    expect(makeStep(libPath).stepTypeName).toBe("path/to/x");

    const libTypePath: LibraryItem = { name: "X", type: "action", typePath: "type/path/x" } as any;
    expect(makeStep(libTypePath).stepTypeName).toBe("type/path/x");

    const libBare: LibraryItem = { name: "PlainName", type: "action" } as any;
    expect(makeStep(libBare).stepTypeName).toBe("PlainName");
  });

  it("clones defaultProps so mutating the step doesn't affect the library item", () => {
    const prop = { key: "value", label: "Value", type: "number", value: 5, group: "General" };
    const lib: LibraryItem = { name: "X", type: "action", defaultProps: [prop] } as any;
    const step = makeStep(lib);
    step.properties[0].value = 999;
    expect(prop.value).toBe(5);
  });

  it("defaults properties to an empty array when defaultProps is absent", () => {
    const lib: LibraryItem = { name: "X", type: "action" } as any;
    expect(makeStep(lib).properties).toEqual([]);
  });

  it("assigns a unique id to each created step", () => {
    const lib: LibraryItem = { name: "X", type: "action" } as any;
    const a = makeStep(lib);
    const b = makeStep(lib);
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// makeSequence
// ---------------------------------------------------------------------------

describe("makeSequence", () => {
  it("uses the default name when none is given", () => {
    const s = makeSequence();
    expect(s.name).toBe("New Sequence");
    expect(s.type).toBe("sequence");
    expect(s.children).toEqual([]);
  });

  it("uses a provided name and mirrors it in the 'name' property", () => {
    const s = makeSequence("My Seq");
    expect(s.name).toBe("My Seq");
    const nameProp = s.properties.find(p => p.key === "name");
    expect(nameProp?.value).toBe("My Seq");
  });

  it("includes verdict and break_on_fail properties with expected defaults", () => {
    const s = makeSequence();
    const verdict = s.properties.find(p => p.key === "verdict");
    const breakOnFail = s.properties.find(p => p.key === "break_on_fail");
    expect(verdict?.value).toBe("AND");
    expect(verdict?.options).toEqual(["AND", "OR", "First"]);
    expect(breakOnFail?.value).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// nowTs
// ---------------------------------------------------------------------------

describe("nowTs", () => {
  it("returns an HH:MM:SS.mmm-shaped timestamp", () => {
    expect(nowTs()).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});

// ---------------------------------------------------------------------------
// toArray
// ---------------------------------------------------------------------------

describe("toArray", () => {
  it("returns the input unchanged if it's already an array", () => {
    expect(toArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("unwraps a { packages: [...] } shape", () => {
    expect(toArray({ packages: ["a", "b"] })).toEqual(["a", "b"]);
  });

  it("unwraps a { value: [...] } shape", () => {
    expect(toArray({ value: [1, 2] })).toEqual([1, 2]);
  });

  it("returns an empty array for unrecognized shapes", () => {
    expect(toArray({ foo: "bar" })).toEqual([]);
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray("string")).toEqual([]);
  });

  it("prefers 'packages' over 'value' when both exist", () => {
    expect(toArray({ packages: [1], value: [2] })).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// moveStepToPosition
// ---------------------------------------------------------------------------

describe("moveStepToPosition", () => {
  it("returns the original tree unchanged if the step id doesn't exist", () => {
    const tree = buildTree();
    const result = moveStepToPosition(tree, "ghost", null, 0);
    expect(result).toBe(tree);
  });

  it("reorders within the same (root) list", () => {
    const tree = [leaf("A"), leaf("B"), leaf("C")];
    // Move "A" to index 2 (after B, before/at C)
    const result = moveStepToPosition(tree, "A", null, 2);
    expect(idPath(result)).toEqual(["B", "A", "C"]);
  });

  it("moves a root item to a nested parent", () => {
    const tree = [leaf("A"), seq("B", [leaf("B1")])];
    const result = moveStepToPosition(tree, "A", "B", 0);
    expect(idPath(result)).toEqual(["B"]);
    expect(findNode(result, "B")?.children?.map(c => c.id)).toEqual(["A", "B1"]);
  });

  it("moves a nested item back out to root at a given index", () => {
    const tree = [leaf("A"), seq("B", [leaf("B1")])];
    const result = moveStepToPosition(tree, "B1", null, 1);
    expect(idPath(result)).toEqual(["A", "B1", "B"]);
    expect(findNode(result, "B")?.children).toEqual([]);
  });

  it("moves an item between two different sequences", () => {
    const tree = [seq("B", [leaf("B1")]), seq("D", [leaf("D1")])];
    const result = moveStepToPosition(tree, "B1", "D", 0);
    expect(findNode(result, "B")?.children).toEqual([]);
    expect(findNode(result, "D")?.children?.map(c => c.id)).toEqual(["B1", "D1"]);
  });

  it("rejects moving a sequence into its own descendant (no-op)", () => {
    const tree = [seq("B", [seq("B2", [leaf("B2a")])])];
    const result = moveStepToPosition(tree, "B", "B2", 0);
    // Structurally unchanged
    expect(idPath(flatAll(result))).toEqual(idPath(flatAll(tree)));
  });

  it("rejects moving a sequence into itself (no-op)", () => {
    const tree = [seq("B", [leaf("B1")])];
    const result = moveStepToPosition(tree, "B", "B", 0);
    expect(idPath(flatAll(result))).toEqual(idPath(flatAll(tree)));
  });

  it("does not duplicate or lose nodes on a multi-level move", () => {
    const tree = buildTree();
    const result = moveStepToPosition(tree, "B2a", null, 0);
    const flatIds = idPath(flatAll(result)).sort();
    const originalIds = idPath(flatAll(tree)).sort();
    expect(flatIds).toEqual(originalIds);
    expect(idPath(result)[0]).toBe("B2a");
  });

  it("adjusts the target index correctly when moving an item later within the same list", () => {
    // Moving "A" (index 0) to index 2 in [A,B,C] should land it between B and C,
    // i.e. result order B, A, C (accounts for the removal shifting indices).
    const tree = [leaf("A"), leaf("B"), leaf("C"), leaf("D")];
    const result = moveStepToPosition(tree, "A", null, 3);
    expect(idPath(result)).toEqual(["B", "C", "A", "D"]);
  });

  it("does not mutate the original tree", () => {
    const tree = buildTree();
    const before = JSON.stringify(tree);
    moveStepToPosition(tree, "B1", null, 0);
    expect(JSON.stringify(tree)).toBe(before);
  });
});
