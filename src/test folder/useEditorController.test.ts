import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const stableEmptyData = vi.hoisted(() => [] as any[]);

// Mock dependencies BEFORE importing the hook  
vi.mock("../app/hooks/useWindowWidth", () => ({
  useWindowWidth: vi.fn(() => 1280),
}));

vi.mock("../app/hooks/useDebounce", () => ({
  useDebounce: vi.fn((value) => value),
}));

vi.mock("../app/hooks/usePlugin", () => ({
  useInstalledPlugins: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useDuts: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useConnections: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useInstruments: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  usePlugins: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useResultListeners: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
  useTraceListeners: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
}));

vi.mock("../api/plugin", () => ({
  removePlugin: vi.fn(() => Promise.resolve({})),
  uploadPlugin: vi.fn(() => Promise.resolve({})),
  cancelRun: vi.fn(() => Promise.resolve({})),
  getRunLogs: vi.fn(() => Promise.resolve([])),
  getRunLogsStreamUrl: vi.fn(() => "http://localhost"),
  getRunStatus: vi.fn(() => Promise.resolve({ status: "completed" })),
  pauseRun: vi.fn(() => Promise.resolve({})),
  resumeRun: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../api/package", () => ({
  installPackage: vi.fn(() => Promise.resolve({})),
  uninstallPackage: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../api/testplans", () => ({
  fetchTestPlans: vi.fn(() => Promise.resolve([])),
  savePlan: vi.fn(() => Promise.resolve({})),
  deletePlan: vi.fn(() => Promise.resolve({})),
  composeTestPlan: vi.fn(() => Promise.resolve({})),
  getStepSchema: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../app/hooks/usePackage", () => ({
  useAvailablePackages: vi.fn(() => ({
    data: stableEmptyData,
    refetch: vi.fn(),
    isFetching: false,
  })),
}));

vi.mock("../app/hooks/useMqttResultListener", () => ({
  useMqttResultListener: vi.fn(() => ({
    data: {},
    isConnected: false,
  })),
}));

vi.mock("../components/editor/resizable", () => ({
  useDragResize: vi.fn(() => ({
    ref: { current: null },
    style: {},
    handleMouseDown: vi.fn(),
  })),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock global crypto
if (!global.crypto) {
  (global as any).crypto = {} as any;
}
(global as any).crypto.randomUUID = vi.fn(() => "uuid-mock");

// Mock URL APIs
if (!global.URL) {
  (global as any).URL = {} as any;
}
(global as any).URL.createObjectURL = vi.fn(() => "blob:mock-url");
(global as any).URL.revokeObjectURL = vi.fn();

// Import the hook AFTER all mocks are defined
import {
  formatMqttResultMessage,
  useEditorController,
} from "../app/hooks/useEditorController";
import { composeTestPlan } from "../api/testplans";

describe("formatMqttResultMessage", () => {
  it("shows ordinary string and numeric result-table values with their names", () => {
    expect(formatMqttResultMessage({
      type: "result-table",
      name: "ACLR Raw Results",
      columns: [
        { name: "Value", values: ["-23.27,-23.24,0.032"] },
        { name: "Passed", values: [true] },
      ],
    })).toEqual([
      "ACLR Raw Results | Value: -23.27,-23.24,0.032",
      "ACLR Raw Results | Passed: true",
    ]);
  });

  it("keeps empty result-table payloads visible for diagnostics", () => {
    const payload = { type: "result-table", columns: [] };
    expect(formatMqttResultMessage(payload)).toEqual([JSON.stringify(payload)]);
  });
});

describe("useEditorController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    (global as any).localStorage = localStorageMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("unit tests for useEditorController hook", () => {
    // This is a placeholder test demonstrating proper mock setup
    // The actual hook is complex and depends on many external services
    expect(useEditorController).toBeDefined();
    expect(typeof useEditorController).toBe("function");
  });

  it("treats a loaded plan as a baseline and undoes only later edits", () => {
    vi.useRealTimers();
    const { result } = renderHook(() => useEditorController());
    const step = (id: string) => ({
      id,
      name: id,
      type: "measure",
      status: "pending",
      enabled: true,
      properties: [],
    });

    act(() => result.current.resetPlanHistory([step("saved-1"), step("saved-2")]));
    expect(result.current.canUndoPlan).toBe(false);

    act(() => result.current.setPlan((plan: any[]) => [...plan, step("new-3")]));
    expect(result.current.canUndoPlan).toBe(true);

    act(() => result.current.undoPlanChange());
    expect(result.current.plan.map((item: any) => item.id)).toEqual(["saved-1", "saved-2"]);
    expect(result.current.canUndoPlan).toBe(false);

    act(() => result.current.redoPlanChange());
    expect(result.current.plan.map((item: any) => item.id)).toEqual(["saved-1", "saved-2", "new-3"]);
  });

  it("does not allow undoing a plan restored after refresh", () => {
    vi.useRealTimers();
    const restoredPlan = [
      { id: "saved-1", name: "One", type: "measure", status: "pending", enabled: true, properties: [] },
      { id: "saved-2", name: "Two", type: "measure", status: "pending", enabled: true, properties: [] },
    ];
    const restoredSnapshot = JSON.stringify({
      hasPlan: true,
      plan: restoredPlan,
      planMeta: { name: "Saved", description: "", author: "", version: "1.0.0" },
      selectedId: null,
      expandedIds: [],
      leftTab: "plan",
      savedPlanSignature: null,
      outputPath: "D:\\Saved.TapPlan",
    });
    vi.mocked(global.localStorage.getItem).mockImplementation((key) =>
      key === "edgex.editor.planSnapshot.v1" ? restoredSnapshot : null,
    );

    const { result } = renderHook(() => useEditorController());
    expect(result.current.plan.map((item: any) => item.id)).toEqual(["saved-1", "saved-2"]);
    expect(result.current.canUndoPlan).toBe(false);

    act(() => result.current.undoPlanChange());
    expect(result.current.plan.map((item: any) => item.id)).toEqual(["saved-1", "saved-2"]);
  });

  it("serializes instrument selector values as a structured object for SCPI steps", async () => {
    const step = {
      id: "step-1",
      name: "Test VISA Connect",
      type: "instrument",
      status: "pending",
      enabled: true,
      stepTypeName: "OpenTap.Plugins.BasicSteps.SCPIRegexStep",
      properties: [
        {
          key: "Instrument || Instrument",
          label: "Instrument",
          type: "string",
          value: "inst 2 (TCPIP::192.168.2.65::INSTR)",
          group: "Schema Properties",
          backendName: "Instrument",
          backendValue: {
            $type: "OpenTap.Plugins.BasicSteps.GenericScpiInstrument",
            Name: "test1",
            VisaAddress: "TCPIP::192.168.2.22::INSTR",
          },
          loadedDisplayValue: "test1 (TCPIP::192.168.2.22::INSTR)",
        },
      ],
    };

    const { result } = renderHook(() => useEditorController());
    act(() => result.current.setPlan(() => [step as any]));
    act(() => result.current.setOutputPath("D:\\plans\\Saved.TapPlan"));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(composeTestPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        outputPath: "D:\\plans\\Saved.TapPlan",
        steps: [
          expect.objectContaining({
            properties: expect.objectContaining({
              Instrument: {
                $type: "OpenTap.Plugins.BasicSteps.GenericScpiInstrument",
                Name: "test1",
                VisaAddress: "TCPIP::192.168.2.22::INSTR",
              },
            }),
          }),
        ],
      }),
    );
  });

  it("localStorage mock should be functional", () => {
    expect(global.localStorage).toBeDefined();
    expect(global.localStorage.getItem("test")).toBeNull();
    global.localStorage.setItem("key", "value");
    expect(global.localStorage.setItem).toHaveBeenCalledWith("key", "value");
  });

  it("crypto global mock should be functional", () => {
    expect((global as any).crypto.randomUUID).toBeDefined();
    const uuid = (global as any).crypto.randomUUID();
    expect(uuid).toBe("uuid-mock");
  });

  it("URL global mocks should be functional", () => {
    expect((global as any).URL.createObjectURL).toBeDefined();
    expect((global as any).URL.revokeObjectURL).toBeDefined();

    const blobUrl = (global as any).URL.createObjectURL({});
    expect(blobUrl).toBe("blob:mock-url");
  });
});
