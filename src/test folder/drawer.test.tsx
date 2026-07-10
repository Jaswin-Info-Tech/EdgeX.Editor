import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
} from "../app/components/ui/drawer";
import { vi } from "vitest";
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    value: () => { },
});

Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    value: () => { },
});

Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    value: () => false,
});

describe("Drawer", () => {
    it("renders the trigger", () => {
        render(
            <Drawer>
                <DrawerTrigger>Open Drawer</DrawerTrigger>
            </Drawer>
        );

        expect(
            screen.getByRole("button", { name: /open drawer/i })
        ).toBeInTheDocument();
    });

    it("opens the drawer", async () => {
        const user = userEvent.setup();

        render(
            <Drawer>
                <DrawerTrigger>Open Drawer</DrawerTrigger>

                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Drawer Title</DrawerTitle>
                        <DrawerDescription>
                            Drawer Description
                        </DrawerDescription>
                    </DrawerHeader>

                    <DrawerFooter>
                        <DrawerClose>Close</DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );

        await user.click(
            screen.getByRole("button", { name: /open drawer/i })
        );

        expect(screen.getByText("Drawer Title")).toBeInTheDocument();
        expect(screen.getByText("Drawer Description")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /close/i })
        ).toBeInTheDocument();
    });

    it("renders header and footer", async () => {
        const user = userEvent.setup();

        render(
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>

                <DrawerContent>
                    <DrawerHeader data-testid="header">
                        <DrawerTitle>Title</DrawerTitle>
                        <DrawerDescription>Description</DrawerDescription>
                    </DrawerHeader>

                    <DrawerFooter data-testid="footer">
                        <DrawerClose>Close</DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );

        await user.click(screen.getByRole("button", { name: /open/i }));

        expect(screen.getByTestId("header")).toBeInTheDocument();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("applies custom className to DrawerContent", async () => {
        const user = userEvent.setup();

        render(
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>

                <DrawerContent className="custom-content">
                    <DrawerHeader>
                        <DrawerTitle>Title</DrawerTitle>
                        <DrawerDescription>Description</DrawerDescription>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );

        await user.click(screen.getByRole("button", { name: /open/i }));

        expect(
            document.querySelector(".custom-content")
        ).toBeInTheDocument();
    });

    it("applies custom className to DrawerHeader", () => {
        const { container } = render(
            <DrawerHeader className="custom-header">
                Header
            </DrawerHeader>
        );

        expect(
            container.querySelector(".custom-header")
        ).toBeInTheDocument();
    });

    it("applies custom className to DrawerFooter", () => {
        const { container } = render(
            <DrawerFooter className="custom-footer">
                Footer
            </DrawerFooter>
        );

        expect(
            container.querySelector(".custom-footer")
        ).toBeInTheDocument();
    });

    it("applies custom className to DrawerTitle", async () => {
        const user = userEvent.setup();

        render(
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>

                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle className="custom-title">
                            My Title
                        </DrawerTitle>

                        <DrawerDescription>Description</DrawerDescription>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );

        await user.click(screen.getByRole("button", { name: /open/i }));

        expect(
            document.querySelector(".custom-title")
        ).toBeInTheDocument();
    });

    it("applies custom className to DrawerDescription", async () => {
        const user = userEvent.setup();

        render(
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>

                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Title</DrawerTitle>

                        <DrawerDescription className="custom-description">
                            Description
                        </DrawerDescription>
                    </DrawerHeader>
                </DrawerContent>
            </Drawer>
        );

        await user.click(screen.getByRole("button", { name: /open/i }));

        expect(
            document.querySelector(".custom-description")
        ).toBeInTheDocument();
    });
});