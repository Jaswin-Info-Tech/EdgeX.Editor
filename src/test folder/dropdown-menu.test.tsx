import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
} from "../app/components/ui/dropdown-menu";

beforeAll(() => {
    globalThis.ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    Element.prototype.scrollIntoView = vi.fn();

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
});

describe("DropdownMenu", () => {
    it("renders the trigger", () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Options</DropdownMenuTrigger>
            </DropdownMenu>
        );

        expect(
            screen.getByRole("button", { name: "Options" })
        ).toBeInTheDocument();
    });

    it("opens the menu when the trigger is clicked", async () => {
        const user = userEvent.setup();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Options</DropdownMenuTrigger>

                <DropdownMenuContent>
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await user.click(
            screen.getByRole("button", { name: "Options" })
        );

        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("calls onSelect when an item is clicked", async () => {
        const user = userEvent.setup();
        const handleSelect = vi.fn();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Options</DropdownMenuTrigger>

                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={handleSelect}>
                        Profile
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await user.click(
            screen.getByRole("button", { name: "Options" })
        );

        await user.click(screen.getByText("Profile"));

        expect(handleSelect).toHaveBeenCalledTimes(1);
    });

    it("renders label and separator", async () => {
        const user = userEvent.setup();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Options</DropdownMenuTrigger>

                <DropdownMenuContent>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await user.click(
            screen.getByRole("button", { name: "Options" })
        );

        expect(screen.getByText("Actions")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("renders a checked checkbox item", async () => {
        const user = userEvent.setup();

        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Options</DropdownMenuTrigger>

                <DropdownMenuContent>
                    <DropdownMenuCheckboxItem checked>
                        Notifications
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await user.click(
            screen.getByRole("button", { name: "Options" })
        );

        expect(
            screen.getByText("Notifications")
        ).toBeInTheDocument();
    });
});