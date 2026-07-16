import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConsolePanel } from "../app/components/editor/ConsolePanel";
import { Splitter } from "../app/components/editor/resizable";

// Mock Splitter
vi.mock("../app/components/editor/resizable", () => ({
  Splitter: ({ onMouseDown }: any) => (
    <div data-testid="splitter" onMouseDown={onMouseDown}>
      Splitter
    </div>
  ),
}));

describe("ConsolePanel", () => {
  const defaultProps = {
    showConsole: true,
    dragConsole: vi.fn(),
    consoleH: 300,
    logs: [],
    filteredLogs: [],
    consoleFilter: "ALL",
    setConsoleFilter: vi.fn(),
    setLogs: vi.fn(),
    setShowConsole: vi.fn(),
    logEndRef: {
      current: document.createElement("div"),
    } as React.RefObject<HTMLDivElement>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders console title", () => {
    render(<ConsolePanel {...defaultProps} />);

    expect(screen.getByText("Console")).toBeInTheDocument();
  });

  it("shows number of log lines", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        logs={[{ id: 1 }, { id: 2 }]}
      />
    );

    expect(screen.getByText("2 lines")).toBeInTheDocument();
  });

  it("shows empty message when no logs exist", () => {
    render(<ConsolePanel {...defaultProps} />);

    expect(screen.getByText("No log entries")).toBeInTheDocument();
  });

  it("renders INFO log entry", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        filteredLogs={[
          {
            id: 1,
            timestamp: "10:00",
            level: "INFO",
            source: "API",
            message: "Application started",
          },
        ]}
      />
    );

    expect(screen.getAllByText("INFO")).toHaveLength(2);
    expect(screen.getByText("Application started")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
  });

  it.each([
    ["DEBUG", "Debug message"],
    ["WARN", "Warning message"],
    ["ERROR", "Error message"],
    ["PASS", "Pass message"],
    ["FAIL", "Fail message"],
  ])("renders %s log entry", (level, message) => {
    render(
      <ConsolePanel
        {...defaultProps}
        filteredLogs={[
          {
            id: 1,
            timestamp: "10:00",
            level,
            source: "Editor",
            message,
          },
        ]}
      />
    );

    expect(screen.getAllByText(level)).toHaveLength(2);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("renders all filter buttons", () => {
    render(<ConsolePanel {...defaultProps} />);

    [
      "ALL",
      "INFO",
      "DEBUG",
      "WARN",
      "ERROR",
      "PASS",
      "FAIL",
    ].forEach((filter) => {
      expect(
        screen.getByRole("button", { name: filter })
      ).toBeInTheDocument();
    });
  });

  it.each([
    "ALL",
    "INFO",
    "DEBUG",
    "WARN",
    "ERROR",
    "PASS",
    "FAIL",
  ])("calls setConsoleFilter when %s is clicked", async (level) => {
    const user = userEvent.setup();

    render(<ConsolePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: level }));

    expect(defaultProps.setConsoleFilter).toHaveBeenCalledWith(level);
  });

  it.each([
    "ALL",
    "INFO",
    "DEBUG",
    "WARN",
    "ERROR",
    "PASS",
    "FAIL",
  ])("highlights %s filter", (level) => {
    render(
      <ConsolePanel
        {...defaultProps}
        consoleFilter={level}
      />
    );

    const button = screen.getByRole("button", {
      name: level,
    });

    expect(button.className).toContain("text-primary");
    expect(button.className).toContain("border-primary");
  });

  it("shows inactive style for non-selected filter", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        consoleFilter="INFO"
      />
    );

    const button = screen.getByRole("button", {
      name: "ERROR",
    });

    expect(button.className).toContain("border-transparent");
  });

  it("renders all log levels together", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        filteredLogs={[
          {
            id: 1,
            timestamp: "1",
            level: "INFO",
            source: "A",
            message: "Info",
          },
          {
            id: 2,
            timestamp: "2",
            level: "DEBUG",
            source: "B",
            message: "Debug",
          },
          {
            id: 3,
            timestamp: "3",
            level: "WARN",
            source: "C",
            message: "Warn",
          },
          {
            id: 4,
            timestamp: "4",
            level: "ERROR",
            source: "D",
            message: "Error",
          },
          {
            id: 5,
            timestamp: "5",
            level: "PASS",
            source: "E",
            message: "Pass",
          },
          {
            id: 6,
            timestamp: "6",
            level: "FAIL",
            source: "F",
            message: "Fail",
          },
        ]}
      />
    );

    expect(screen.getByText("Info")).toBeInTheDocument();
    expect(screen.getByText("Debug")).toBeInTheDocument();
    expect(screen.getByText("Warn")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Pass")).toBeInTheDocument();
    expect(screen.getByText("Fail")).toBeInTheDocument();
  });

  it("calls setLogs when Clear button is clicked", async () => {
    const user = userEvent.setup();

    render(<ConsolePanel {...defaultProps} />);

    const clearButton = screen.getByTitle("Clear");

    await user.click(clearButton);

    expect(defaultProps.setLogs).toHaveBeenCalledWith([]);
  });

  it("calls setShowConsole when toggle button is clicked", async () => {
    const user = userEvent.setup();

    render(<ConsolePanel {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons[buttons.length - 1];

    await user.click(toggleButton);

    expect(defaultProps.setShowConsole).toHaveBeenCalled();
  });

  it("renders splitter when console is visible", () => {
    render(<ConsolePanel {...defaultProps} />);

    expect(screen.getByTestId("splitter")).toBeInTheDocument();
  });

  it("does not render splitter when console is hidden", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        showConsole={false}
      />
    );

    expect(screen.queryByTestId("splitter")).not.toBeInTheDocument();
  });

  it("calls dragConsole when splitter is pressed", async () => {
  const user = userEvent.setup();

  render(<ConsolePanel {...defaultProps} />);

  const splitter = screen.queryByTestId("splitter");

  expect(splitter).toBeInTheDocument();

  await user.pointer({
    target: splitter!,
    keys: "[MouseLeft]",
  });

  expect(defaultProps.dragConsole).toHaveBeenCalled();
});

  it("hides log area when console is collapsed", () => {
    render(
      <ConsolePanel
        {...defaultProps}
        showConsole={false}
      />
    );

    expect(screen.queryByText("No log entries")).not.toBeInTheDocument();
  });
});