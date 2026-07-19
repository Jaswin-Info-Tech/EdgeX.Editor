import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
    RadioGroup,
    RadioGroupItem,
} from "../app/components/ui/radio-group";

describe("RadioGroup", () => {
    it("renders the radio group", () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem value="one" />
            </RadioGroup>
        );

        expect(
            container.querySelector('[data-slot="radio-group"]')
        ).toBeInTheDocument();
    });

    it("renders radio items", () => {
        render(
            <RadioGroup>
                <RadioGroupItem value="one" aria-label="Option One" />
                <RadioGroupItem value="two" aria-label="Option Two" />
            </RadioGroup>
        );

        expect(
            screen.getByRole("radio", { name: "Option One" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("radio", { name: "Option Two" })
        ).toBeInTheDocument();
    });

    it("selects a radio item when clicked", async () => {
        const user = userEvent.setup();

        render(
            <RadioGroup defaultValue="one">
                <RadioGroupItem value="one" aria-label="Option One" />
                <RadioGroupItem value="two" aria-label="Option Two" />
            </RadioGroup>
        );

        const optionTwo = screen.getByRole("radio", {
            name: "Option Two",
        });

        await user.click(optionTwo);

        expect(optionTwo).toBeChecked();
    });

    it("calls onValueChange when selection changes", async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
            <RadioGroup onValueChange={handleChange}>
                <RadioGroupItem value="one" aria-label="Option One" />
                <RadioGroupItem value="two" aria-label="Option Two" />
            </RadioGroup>
        );

        await user.click(
            screen.getByRole("radio", { name: "Option Two" })
        );

        expect(handleChange).toHaveBeenCalledWith("two");
    });

    it("applies a custom className to RadioGroup", () => {
        const { container } = render(
            <RadioGroup className="custom-group">
                <RadioGroupItem value="one" />
            </RadioGroup>
        );

        expect(container.querySelector(".custom-group")).toBeInTheDocument();
    });

    it("applies a custom className to RadioGroupItem", () => {
        const { container } = render(
            <RadioGroup>
                <RadioGroupItem
                    value="one"
                    className="custom-item"
                    aria-label="Option One"
                />
            </RadioGroup>
        );

        expect(container.querySelector(".custom-item")).toBeInTheDocument();
    });

    it("renders the indicator when selected", () => {
        const { container } = render(
            <RadioGroup defaultValue="one">
                <RadioGroupItem value="one" aria-label="Option One" />
            </RadioGroup>
        );

        expect(
            container.querySelector('[data-slot="radio-group-indicator"]')
        ).toBeInTheDocument();
    });

    it("supports disabled radio items", () => {
        render(
            <RadioGroup>
                <RadioGroupItem
                    value="one"
                    disabled
                    aria-label="Disabled Option"
                />
            </RadioGroup>
        );

        expect(
            screen.getByRole("radio", { name: "Disabled Option" })
        ).toBeDisabled();
    });
});