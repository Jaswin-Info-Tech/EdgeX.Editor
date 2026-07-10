import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverAnchor,
} from "../app/components/ui/popover";

describe("Popover", () => {
    it("renders the trigger", () => {
        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
            </Popover>
        );

        expect(
            screen.getByRole("button", { name: "Open" })
        ).toBeInTheDocument();
    });

    it("opens when the trigger is clicked", async () => {
        const user = userEvent.setup();

        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Popover Content</PopoverContent>
            </Popover>
        );

        await user.click(screen.getByRole("button", { name: "Open" }));

        expect(screen.getByText("Popover Content")).toBeInTheDocument();
    });

    it("closes when the trigger is clicked again", async () => {
        const user = userEvent.setup();

        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>
                <PopoverContent>Popover Content</PopoverContent>
            </Popover>
        );

        const trigger = screen.getByRole("button", { name: "Open" });

        await user.click(trigger);
        expect(screen.getByText("Popover Content")).toBeInTheDocument();

        await user.click(trigger);

        expect(screen.queryByText("Popover Content")).not.toBeInTheDocument();
    });

    it("renders an anchor", () => {
        render(
            <Popover>
                <PopoverAnchor data-testid="anchor" />
                <PopoverTrigger>Open</PopoverTrigger>
            </Popover>
        );

        expect(screen.getByTestId("anchor")).toBeInTheDocument();
    });

    it("accepts a custom className", async () => {
        const user = userEvent.setup();

        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>

                <PopoverContent className="custom-popover">
                    Content
                </PopoverContent>
            </Popover>
        );

        await user.click(screen.getByRole("button", { name: "Open" }));

        expect(document.querySelector(".custom-popover")).toBeInTheDocument();
    });

    it("renders with custom align and sideOffset", async () => {
        const user = userEvent.setup();

        render(
            <Popover>
                <PopoverTrigger>Open</PopoverTrigger>

                <PopoverContent align="start" sideOffset={12}>
                    Content
                </PopoverContent>
            </Popover>
        );

        await user.click(screen.getByRole("button", { name: "Open" }));

        expect(screen.getByText("Content")).toBeInTheDocument();
    });
});