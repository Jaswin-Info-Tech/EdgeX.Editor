import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { InstrumentsPanel } from "../app/components/editor/benchModals";

// Mock API
vi.mock("../app/api/resources", () => ({
    getResources: vi.fn().mockResolvedValue([]),
    getResourceSchema: vi.fn().mockResolvedValue({ properties: [] }),
    addResource: vi.fn(),
    updateResource: vi.fn(),
    deleteResource: vi.fn(),
    extractTypeName: vi.fn((type: string) => type),
}));

// Mock PropertyEditors
vi.mock("../app/components/editor/PropertyEditors", () => ({
    renderEditor: vi.fn(() => null),
}));

describe("InstrumentsPanel", () => {
    const defaultProps = {
        instruments: [
            {
                name: "Signal Generator",
                assembly: "Test.Assembly",
            },
        ],
        search: "",
        setSearch: vi.fn(),
        isLoading: false,
        isError: false,
        onClose: vi.fn(),
        onResourcesChanged: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the panel title", () => {
        render(<InstrumentsPanel {...defaultProps} />);

        expect(screen.getByText("Add Instrument")).toBeInTheDocument();
    });

    it("renders the instrument type", () => {
        render(<InstrumentsPanel {...defaultProps} />);

        expect(screen.getByText("Signal Generator")).toBeInTheDocument();
    });

    it("calls onClose when Close button is clicked", async () => {
        const user = userEvent.setup();

        render(<InstrumentsPanel {...defaultProps} />);

        const closeButtons = screen.getAllByRole("button", { name: /close/i });

        await user.click(closeButtons[0]);

        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("calls setSearch when typing in search box", async () => {
        const user = userEvent.setup();

        render(<InstrumentsPanel {...defaultProps} />);

        const input = screen.getByPlaceholderText("Search instrument type...");

        await user.type(input, "Signal");

        expect(defaultProps.setSearch).toHaveBeenCalled();
    });

    it("shows loading message", () => {
        render(
            <InstrumentsPanel
                {...defaultProps}
                isLoading={true}
            />
        );

        expect(screen.getByText("Loading instruments...")).toBeInTheDocument();
    });

    it("shows error message", () => {
        render(
            <InstrumentsPanel
                {...defaultProps}
                isLoading={false}
                isError={true}
            />
        );

        expect(
            screen.getByText("Unable to load instruments.")
        ).toBeInTheDocument();
    });

    it("shows empty state when no instruments exist", () => {
        render(
            <InstrumentsPanel
                {...defaultProps}
                instruments={[]}
            />
        );

        expect(
            screen.getByText("No instruments available.")
        ).toBeInTheDocument();
    });

    it("selects an instrument when clicked", async () => {
        const user = userEvent.setup();

        render(<InstrumentsPanel {...defaultProps} />);

        await user.click(screen.getByText("Signal Generator"));

        expect(
            screen.getByText("Signal Generator Resources")
        ).toBeInTheDocument();
    });

    it("removes later breadcrumbs when navigating to a previous step", async () => {
        const user = userEvent.setup();

        render(<InstrumentsPanel {...defaultProps} />);

        await user.click(screen.getByText("Signal Generator"));
        expect(
            screen.getByRole("button", { name: "Signal Generator Resources" })
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Instrument Types" }));

        expect(
            screen.queryByRole("button", { name: "Signal Generator Resources" })
        ).not.toBeInTheDocument();
    });
});
