import { describe, it, expect } from "vitest";
import type {
  StepStatus,
  RunState,
  Property,
  TestStep,
  LogEntry,
  LibraryItem,
  InstrumentItem,
  ConnectionItem,
  DutItem,
  TestPlanItem,
  Plugin,
  PlanMeta,
  CtxMenu,
  SequenceStepProps,
} from "./editor";

describe("Type Definitions", () => {
  it("accepts valid StepStatus values", () => {
    const status: StepStatus = "passed";
    expect(status).toBe("passed");
  });

  it("accepts valid RunState values", () => {
    const state: RunState = "running";
    expect(state).toBe("running");
  });

  it("creates a valid Property object", () => {
    const property: Property = {
      key: "frequency",
      label: "Frequency",
      type: "number",
      value: 100,
      group: "General",
    };

    expect(property.key).toBe("frequency");
  });

  it("creates a valid TestStep", () => {
    const step: TestStep = {
      id: "1",
      name: "Delay",
      type: "DelayStep",
      status: "pending",
      enabled: true,
      properties: [],
    };

    expect(step.name).toBe("Delay");
  });

  it("creates a valid LogEntry", () => {
    const log: LogEntry = {
      id: 1,
      timestamp: "2026-07-14",
      level: "INFO",
      source: "Runner",
      message: "Started",
    };

    expect(log.level).toBe("INFO");
  });

  it("creates a valid LibraryItem", () => {
    const item: LibraryItem = {
      id: "lib1",
      name: "Delay",
      category: "Basic",
      description: "Delay step",
      type: "DelayStep",
      defaultProps: [],
    };

    expect(item.category).toBe("Basic");
  });

  it("creates a valid InstrumentItem", () => {
    const instrument: InstrumentItem = {
      name: "Scope",
      assembly: "OpenTap",
      baseType: "Instrument",
      canCreateInstance: true,
      isBrowsable: true,
    };

    expect(instrument.canCreateInstance).toBe(true);
  });

  it("creates a valid ConnectionItem", () => {
    const connection: ConnectionItem = {
      name: "TCP",
      assembly: "OpenTap",
      baseType: "Connection",
      canCreateInstance: true,
      isBrowsable: true,
    };

    expect(connection.baseType).toBe("Connection");
  });

  it("creates a valid DutItem", () => {
    const dut: DutItem = {
      name: "Device",
      serialNumber: "123",
      model: "ABC",
      firmware: "1.0",
    };

    expect(dut.serialNumber).toBe("123");
  });

  it("creates a valid TestPlanItem", () => {
    const plan: TestPlanItem = {
      name: "Plan",
      path: "/plans",
      stepCount: 5,
      lastModified: "today",
    };

    expect(plan.stepCount).toBe(5);
  });

  it("creates a valid Plugin", () => {
    const plugin: Plugin = {
      id: "1",
      name: "Plugin",
      version: "1.0",
      author: "OpenAI",
      description: "Test Plugin",
    };

    expect(plugin.version).toBe("1.0");
  });

  it("creates a valid PlanMeta", () => {
    const meta: PlanMeta = {
      name: "Plan",
      description: "Description",
      author: "Kavya",
      version: "1.0",
      dutName: "DUT",
      dutSerial: "123",
      dutModel: "ABC",
      dutFirmware: "1.0",
    };

    expect(meta.author).toBe("Kavya");
  });

  it("creates a valid CtxMenu", () => {
    const menu: CtxMenu = {
      x: 10,
      y: 20,
      stepId: "step1",
    };

    expect(menu.stepId).toBe("step1");
  });

  it("creates a valid SequenceStepProps object", () => {
    const props: SequenceStepProps = {
      step: {
        id: "1",
        name: "Step",
        type: "Delay",
        status: "pending",
        enabled: true,
        properties: [],
      },
      parentId: null,
      idx: 0,
      selectedId: null,
      expanded: {},
      renaming: false,
      renameRef: null,
      renameVal: "",
      setRenameVal: () => { },
      commitRename: () => { },
      setRenaming: () => { },
      setSelectedId: () => { },
      setContextMenu: () => { },
      toggleExpand: () => { },
      isTablet: false,
      setRightOpen: () => { },
      dragLibItem: null,
      dropIdx: null,
      setDropIdx: () => { },
      dragOverSequenceId: null,
      setDragOverSequenceId: () => { },
      handleSeqDrop: () => { },
      setPlan: () => { },
      setAddStepParentId: () => { },
      setAddStepIdx: () => { },
      setShowAddStep: () => { },
    };

    expect(props.idx).toBe(0);
  });
}); 