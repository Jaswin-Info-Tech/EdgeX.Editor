import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "../app/components/ui/resizable";

describe("Resizable", () => {
    it("renders the panel group", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(
            container.querySelector('[data-slot="resizable-panel-group"]')
        ).toBeInTheDocument();
    });

    it("renders both panels", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(
            container.querySelectorAll('[data-slot="resizable-panel"]')
        ).toHaveLength(2);
    });

    it("renders the resize handle", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(
            container.querySelector('[data-slot="resizable-handle"]')
        ).toBeInTheDocument();
    });

    it("renders the grip icon when withHandle is true", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("does not render the grip icon when withHandle is false", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(container.querySelector("svg")).not.toBeInTheDocument();
    });

    it("applies custom className to PanelGroup", () => {
        const { container } = render(
            <ResizablePanelGroup
                direction="horizontal"
                className="custom-group"
            >
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(container.querySelector(".custom-group")).toBeInTheDocument();
    });

    it("applies custom className to Handle", () => {
        const { container } = render(
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>Left</ResizablePanel>
                <ResizableHandle className="custom-handle" />
                <ResizablePanel defaultSize={50}>Right</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(container.querySelector(".custom-handle")).toBeInTheDocument();
    });

    it("renders vertical panel group", () => {
        const { container } = render(
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>Top</ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>Bottom</ResizablePanel>
            </ResizablePanelGroup>
        );

        expect(
            container.querySelector('[data-panel-group-direction="vertical"]')
        ).toBeInTheDocument();
    });
});