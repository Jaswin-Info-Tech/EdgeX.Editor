import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RefObject } from "react";
import { ConsolePanel } from "../app/components/editor/ConsolePanel";

// Mock Splitter
vi.mock("../app/components/ui/resizable", () => ({
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

    it("renders log entries", () => {
        render(
            <ConsolePanel
                {...defaultProps}
                logs={[{ id: 1 }]}
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

        expect(screen.getByText("Application started")).toBeInTheDocument();
        expect(screen.getAllByText("INFO")).toHaveLength(2);
        expect(screen.getByText("API")).toBeInTheDocument();
    });

    it("calls setConsoleFilter when INFO is clicked", async () => {
        const user = userEvent.setup();

        render(<ConsolePanel {...defaultProps} />);

        await user.click(screen.getByRole("button", { name: "INFO" }));

        expect(defaultProps.setConsoleFilter).toHaveBeenCalledWith("INFO");
    });

    it("calls setLogs when Clear button is clicked", async () => {
        const user = userEvent.setup();

        render(<ConsolePanel {...defaultProps} />);

        const buttons = screen.getAllByRole("button");

        // Clear button is before toggle button
        await user.click(buttons[7]);

        expect(defaultProps.setLogs).toHaveBeenCalledWith([]);
    });

    it("calls setShowConsole when toggle button is clicked", async () => {
        const user = userEvent.setup();

        render(<ConsolePanel {...defaultProps} />);

        const buttons = screen.getAllByRole("button");

        await user.click(buttons[8]);

        expect(defaultProps.setShowConsole).toHaveBeenCalled();
    });

    it("renders splitter", () => {
        const { container } = render(<ConsolePanel {...defaultProps} />);

        expect(
            container.querySelector(".cursor-row-resize")
        ).toBeInTheDocument();
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

    it("calls dragConsole", async () => {
        const user = userEvent.setup();

        const { container } = render(<ConsolePanel {...defaultProps} />);

        const splitter = container.querySelector(".cursor-row-resize")!;

        await user.pointer({
            target: splitter,
            keys: "[MouseLeft]",
        });

        expect(defaultProps.dragConsole).toHaveBeenCalled();
    });
});