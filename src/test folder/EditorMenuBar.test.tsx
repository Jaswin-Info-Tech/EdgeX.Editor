import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MenuBar } from "../app/components/editor/MenuBar";

const defaultProps = {
  activeMenu: null,
  setActiveMenu: vi.fn(),

  hasPlan: false,
  planMeta: {},

  runState: "idle",

  isTablet: false,

  leftOpen: true,
  setLeftOpen: vi.fn(),

  rightOpen: true,
  setRightOpen: vi.fn(),

  showConsole: true,
  setShowConsole: vi.fn(),

  isDark: false,
  setIsDark: vi.fn(),

  setShowNewPlan: vi.fn(),
  setShowPluginMgr: vi.fn(),

  setShowInstrumentsPanel: vi.fn(),
  setShowDutsPanel: vi.fn(),
  setShowConnectionsPanel: vi.fn(),
  setShowResultListenersPanel: vi.fn(),
  setShowTraceListenersPanel: vi.fn(),

  activeServerName: "Local Server",
  activeServerHealth: "healthy" as const,

  onOpenServerSettings: vi.fn(),

  handleSave: vi.fn(),
  handleExportPlan: vi.fn(),
  handleImportPlan: vi.fn(),

  handleRun: vi.fn(),
  handleStop: vi.fn(),
  handlePause: vi.fn(),
  handleReset: vi.fn(),
};

describe("MenuBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders application title", () => {
    render(<MenuBar {...defaultProps} />);

    expect(screen.getByText("EDGE")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders all top menus", () => {
    render(<MenuBar {...defaultProps} />);

    expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bench" })).toBeInTheDocument();
  });

  it("opens File menu", async () => {
    const user = userEvent.setup();

    render(
      <MenuBar
        {...defaultProps}
        activeMenu="File"
      />
    );

    expect(screen.getByText("Import Plan")).toBeInTheDocument();
    expect(screen.getByText("Export Plan")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "File" }));

    expect(defaultProps.setActiveMenu).toHaveBeenCalled();
  });

  it("opens View menu", () => {
    render(
      <MenuBar
        {...defaultProps}
        activeMenu="View"
      />
    );

    expect(screen.getByText("Step Library")).toBeInTheDocument();
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(screen.getByText("Console")).toBeInTheDocument();
    expect(screen.getByText("Reset Layout")).toBeInTheDocument();
  });

  it("opens Bench menu", () => {
    render(
      <MenuBar
        {...defaultProps}
        activeMenu="Bench"
      />
    );

    expect(screen.getByText("Instruments")).toBeInTheDocument();
    expect(screen.getByText("DUTs")).toBeInTheDocument();
    expect(screen.getByText("Connections")).toBeInTheDocument();
    expect(screen.getByText("Result Listeners")).toBeInTheDocument();
    expect(screen.getByText("Trace Listeners")).toBeInTheDocument();
  });

  it("shows run state", () => {
    render(
      <MenuBar
        {...defaultProps}
        runState="running"
      />
    );

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("shows server name", () => {
    render(<MenuBar {...defaultProps} />);

    expect(screen.getByText(/Server:/)).toBeInTheDocument();
    expect(screen.getByText(/Local Server/)).toBeInTheDocument();
  });

  it("shows plan metadata", () => {
    render(
      <MenuBar
        {...defaultProps}
        hasPlan
        planMeta={{
          dutName: "Demo DUT",
        }}
      />
    );

    expect(screen.getByText(/DUT:/)).toBeInTheDocument();
    expect(screen.getByText(/Demo DUT/)).toBeInTheDocument();
  });

  it("calls server settings handler", async () => {
    const user = userEvent.setup();

    render(<MenuBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");

    await user.click(buttons[buttons.length - 2]);

    expect(defaultProps.onOpenServerSettings).toHaveBeenCalled();
  });

  it("toggles theme", async () => {
    const user = userEvent.setup();

    render(<MenuBar {...defaultProps} />);

    const buttons = screen.getAllByRole("button");

    await user.click(buttons[buttons.length - 1]);

    expect(defaultProps.setIsDark).toHaveBeenCalled();
  });

  it("renders tablet panel buttons", () => {
    render(
      <MenuBar
        {...defaultProps}
        isTablet
      />
    );

    expect(screen.getAllByRole("button").length).toBeGreaterThan(5);
  });
});