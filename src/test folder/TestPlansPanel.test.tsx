import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestPlansPanel } from "../app/components/editor/TestPlansPanel";

const defaultProps = {
    testPlans: [],
    query: "",
    setQuery: vi.fn(),
    hasSearched: false,
    isLoading: false,
    isError: false,
    openingPath: null,
    openError: "",
    showUnsavedWarning: false,
    pendingTestPlan: null,
    onSearch: vi.fn(),
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onCancelUnsavedWarning: vi.fn(),
    onSaveUnsavedChanges: vi.fn(),
    onUploadTapPlan: vi.fn(),
    onImportRemotePlan: vi.fn(),
};

describe("TestPlansPanel", () => {

    it("renders Test Plans heading", () => {
        render(<TestPlansPanel {...defaultProps} />);

        expect(screen.getByText("Test Plans")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Browse Local Path" })
        ).toBeInTheDocument();
    });


    it("calls onClose when close button is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <TestPlansPanel
                {...defaultProps}
                onClose={onClose}
            />
        );

        const closeButton = screen.getByTitle("Close");

        await user.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });


    it("shows loading state while searching plans", () => {
        render(
            <TestPlansPanel
                {...defaultProps}
                hasSearched={true}
                isLoading={true}
            />
        );

        expect(
            screen.getByText("Searching test plans on disk...")
        ).toBeInTheDocument();
    });


    it("renders test plan list and opens selected plan", async () => {
        const user = userEvent.setup();

        const plan = {
            name: "Demo Plan",
            path: "D:\\plans\\demo.tapplan",
            stepCount: 5,
            lastModified: "2026-07-10T10:00:00Z",
        };

        const onOpen = vi.fn();

        render(
            <TestPlansPanel
                {...defaultProps}
                testPlans={[plan]}
                hasSearched={true}
                onOpen={onOpen}
            />
        );

        expect(screen.getByText("Demo Plan")).toBeInTheDocument();

        await user.click(screen.getByText("Demo Plan"));

        expect(onOpen).toHaveBeenCalledWith(plan);
    });


    it("switches to upload mode and validates empty upload", async () => {
        const user = userEvent.setup();

        render(<TestPlansPanel {...defaultProps} />);

        await user.click(
            screen.getByText("Upload .TapPlan")
        );

        expect(
            screen.getByText("Manual .TapPlan Upload")
        ).toBeInTheDocument();

        const uploadButton = screen.getByText(
            "Upload to API Server"
        );

        await user.click(uploadButton);

        await waitFor(() => {
           expect(
  screen.getAllByText("Select a .TapPlan file before uploading.")[0]
).toBeInTheDocument();
        });
    });

});