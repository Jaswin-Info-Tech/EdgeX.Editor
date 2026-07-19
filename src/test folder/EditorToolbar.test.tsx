import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorToolbar } from "../app/components/editor/EditorToolbar";

// Mock ToolBtn
vi.mock("../app/components/editor/atoms", () => ({
    ToolBtn: ({
        children,
        onClick,
        disabled,
        title,
        active,
    }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            data-active={active}
        >
            {children}
        </button>
    ),
}));

describe("EditorToolbar", () => {
    const props = {
        isTablet: false,
        hasPlan: true,
        plan: [{ id: 1 }],
        stats: {
            passed: 1,
            failed: 1,
            total: 2,
        },
        runState: "idle",
        isSaved: true,

        setShowNewPlan: vi.fn(),
        setShowPluginMgr: vi.fn(),
        setShowResourcesPanel: vi.fn(),
        setShowTestPlansPanel: vi.fn(),
        showSystemKpis: false,
        setShowSystemKpis: vi.fn(),
        setAddStepParentId: vi.fn(),
        setAddStepIdx: vi.fn(),
        setShowAddStep: vi.fn(),

        handleSave: vi.fn(),
        handleRun: vi.fn(),
        handlePause: vi.fn(),
        handleStop: vi.fn(),
        handleReset: vi.fn(),
        handleAddGroup: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders toolbar buttons", () => {
        render(<EditorToolbar {...props} />);

        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Save")).toBeInTheDocument();
        expect(screen.getByText("Run")).toBeInTheDocument();
        expect(screen.getByText("Plugins")).toBeInTheDocument();
        expect(screen.getByText("Test Plans")).toBeInTheDocument();
        expect(screen.getByText("System")).toBeInTheDocument();
    });

    it("calls setShowNewPlan", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("New"));

        expect(props.setShowNewPlan).toHaveBeenCalledWith(true);
    });

    it("calls handleSave", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("Save"));

        expect(props.handleSave).toHaveBeenCalled();
    });

    it("calls handleRun", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("Run"));

        expect(props.handleRun).toHaveBeenCalled();
    });

    it("calls handlePause", async () => {
        const user = userEvent.setup();

        render(
            <EditorToolbar
                {...props}
                runState="running"
            />
        );

        const pauseButton = screen.getByTitle("Pause (F6)");

        await user.click(pauseButton);

        expect(props.handlePause).toHaveBeenCalled();
    });

    it("calls handleStop", async () => {
        const user = userEvent.setup();

        render(
            <EditorToolbar
                {...props}
                runState="running"
            />
        );

        const stopButton = screen.getByTitle("Stop (F7)");

        await user.click(stopButton);

        expect(props.handleStop).toHaveBeenCalled();
    });

    it("calls handleReset", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        const resetButton = screen.getByTitle("Reset");

        await user.click(resetButton);

        expect(props.handleReset).toHaveBeenCalled();
    });

    it("opens plugin manager", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("Plugins"));

        expect(props.setShowPluginMgr).toHaveBeenCalledWith(true);
    });

    it("opens test plans", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("Test Plans"));

        expect(props.setShowTestPlansPanel).toHaveBeenCalledWith(true);
    });

    it("toggles system KPIs", async () => {
        const user = userEvent.setup();

        render(<EditorToolbar {...props} />);

        await user.click(screen.getByText("System"));

        expect(props.setShowSystemKpis).toHaveBeenCalledWith(true);
    });

    it("shows PASS and FAIL stats", () => {
        render(<EditorToolbar {...props} />);

        expect(screen.getByText("1 PASS")).toBeInTheDocument();
        expect(screen.getByText("1 FAIL")).toBeInTheDocument();
    });

    it("shows RUNNING badge", () => {
        render(
            <EditorToolbar
                {...props}
                runState="running"
            />
        );

        expect(screen.getByText("RUNNING")).toBeInTheDocument();
    });

    it("disables Run button when no plan exists", () => {
        render(
            <EditorToolbar
                {...props}
                hasPlan={false}
                plan={[]}
            />
        );

        expect(screen.getByText("Run")).toBeDisabled();
    });

    it("disables Run button when plan is not saved", () => {
        render(
            <EditorToolbar
                {...props}
                isSaved={false}
            />
        );

        expect(screen.getByText("Run")).toBeDisabled();
    });

    it("does not show text labels on tablet", () => {
        render(
            <EditorToolbar
                {...props}
                isTablet={true}
            />
        );

        expect(screen.queryByText("New")).not.toBeInTheDocument();
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
        expect(screen.queryByText("Plugins")).not.toBeInTheDocument();
    });
});