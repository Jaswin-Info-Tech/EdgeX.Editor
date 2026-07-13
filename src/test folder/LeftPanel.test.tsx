import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { LeftPanel } from "../app/components/editor/LeftPanel";

// Mock StepTree
vi.mock("../app/components/editor/StepTree", () => ({
  StepTree: ({ step }: any) => <div>{step.name}</div>,
}));

// Mock TypeIcon
vi.mock("../app/components/editor/atoms", () => ({
  TypeIcon: () => <div data-testid="type-icon" />,
}));

// Mock flatAll
vi.mock("../app/utils/editor", () => ({
  flatAll: (plan: any[]) => plan,
}));

describe("LeftPanel", () => {
  const props = {
    leftTab: "plan" as const,
    setLeftTab: vi.fn(),
    plan: [],
    hasPlan: false,
    expanded: new Set<string>(),
    setExpanded: vi.fn(),
    handleAddGroup: vi.fn(),
    setShowNewPlan: vi.fn(),
    libSearch: "",
    setLibSearch: vi.fn(),
    libCat: "All",
    setLibCat: vi.fn(),
    libCats: ["All", "Flow", "RF"],
    libFilterOpen: false,
    setLibFilterOpen: vi.fn(),
    filteredLib: [],
    data: [],
    instruments: [],
    instrumentSearch: "",
    setInstrumentSearch: vi.fn(),
    isInstrumentsLoading: false,
    isInstrumentsError: false,
    setDragLibItem: vi.fn(),
    setDropIdx: vi.fn(),
    handleAddStep: vi.fn(),
    selectedStep: null,
    selectedId: null,
    plugins: [],
    handleInstallPlugin: vi.fn(),
    setShowPluginMgr: vi.fn(),
    renaming: null,
    renameRef: React.createRef<HTMLInputElement>(),
    renameVal: "",
    setRenameVal: vi.fn(),
    commitRename: vi.fn(),
    setRenaming: vi.fn(),
    setSelectedId: vi.fn(),
    setContextMenu: vi.fn(),
    toggleExpand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders plan tab", () => {
    render(<LeftPanel {...props} />);

    expect(screen.getByText("Plan Structure")).toBeInTheDocument();
  });

  it("shows create plan button when no plan exists", () => {
    render(<LeftPanel {...props} />);

    expect(screen.getByRole("button", { name: /create plan/i })).toBeInTheDocument();
  });

  it("calls setShowNewPlan when Create Plan clicked", async () => {
    const user = userEvent.setup();

    render(<LeftPanel {...props} />);

    await user.click(screen.getByRole("button", { name: /create plan/i }));

    expect(props.setShowNewPlan).toHaveBeenCalledWith(true);
  });

  it("renders plan steps", () => {
    render(
      <LeftPanel
        {...props}
        hasPlan
        plan={[
          {
            id: "1",
            name: "Step 1",
          },
        ]}
      />
    );

    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("switches to library tab", async () => {
    const user = userEvent.setup();

    render(
      <LeftPanel
        {...props}
        leftTab="library"
      />
    );

    expect(
      screen.getByPlaceholderText(/search step library/i)
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/search step library/i),
      "Test"
    );

    expect(props.setLibSearch).toHaveBeenCalled();
  });

  it("shows empty library message", () => {
    render(
      <LeftPanel
        {...props}
        leftTab="library"
      />
    );

    expect(
      screen.getByText(/no steps match your search/i)
    ).toBeInTheDocument();
  });

  it("renders library items", () => {
    render(
      <LeftPanel
        {...props}
        leftTab="library"
        filteredLib={[
          {
            id: "1",
            name: "Delay",
            category: "Flow",
            baseType: "Flow",
            assembly: "Core",
          },
        ]}
      />
    );

    expect(screen.getByText("Delay")).toBeInTheDocument();
  });

  it("double clicking library item adds step", async () => {
    const user = userEvent.setup();

    render(
      <LeftPanel
        {...props}
        leftTab="library"
        hasPlan
        filteredLib={[
          {
            id: "1",
            name: "Delay",
            type: "flow",
            category: "Flow",
            baseType: "Flow",
            assembly: "Core",
          },
        ]}
      />
    );

    await user.dblClick(screen.getByText("Delay"));

    expect(props.handleAddStep).toHaveBeenCalled();
  });

  it("opens filter popup", async () => {
    const user = userEvent.setup();

    render(
      <LeftPanel
        {...props}
        leftTab="library"
      />
    );

    const filterBtn = screen.getByTitle(/filter by category/i);

    await user.click(filterBtn);

    expect(props.setLibFilterOpen).toHaveBeenCalled();
  });

  it("shows filter banner", () => {
    render(
      <LeftPanel
        {...props}
        leftTab="library"
        libCat="Flow"
      />
    );

    expect(screen.getByText(/filter: flow/i)).toBeInTheDocument();
  });

  it("clears filter", async () => {
    const user = userEvent.setup();

    render(
      <LeftPanel
        {...props}
        leftTab="library"
        libCat="Flow"
      />
    );

    const buttons = screen.getAllByRole("button");

    await user.click(buttons[buttons.length - 1]);

    expect(props.setLibCat).toHaveBeenCalledWith("All");
  });
});