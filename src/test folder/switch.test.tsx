import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "../app/components/ui/switch";

describe("Switch", () => {
    it("renders the switch", () => {
        render(<Switch />);

        expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("is unchecked by default", () => {
        render(<Switch />);

        expect(screen.getByRole("switch")).toHaveAttribute(
            "data-state",
            "unchecked"
        );
    });

    it("toggles when clicked", async () => {
        const user = userEvent.setup();

        render(<Switch />);

        const sw = screen.getByRole("switch");

        expect(sw).toHaveAttribute("data-state", "unchecked");

        await user.click(sw);

        expect(sw).toHaveAttribute("data-state", "checked");

        await user.click(sw);

        expect(sw).toHaveAttribute("data-state", "unchecked");
    });

    it("supports defaultChecked", () => {
        render(<Switch defaultChecked />);

        expect(screen.getByRole("switch")).toHaveAttribute(
            "data-state",
            "checked"
        );
    });

    it("accepts a custom className", () => {
        render(<Switch className="custom-switch" />);

        expect(document.querySelector(".custom-switch")).toBeInTheDocument();
    });

    it("can be disabled", () => {
        render(<Switch disabled />);

        expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("renders the thumb", () => {
        const { container } = render(<Switch />);

        expect(
            container.querySelector('[data-slot="switch-thumb"]')
        ).toBeInTheDocument();
    });

    it("calls onCheckedChange", async () => {
        const user = userEvent.setup();

        const handleChange = vi.fn();

        render(<Switch onCheckedChange={handleChange} />);

        await user.click(screen.getByRole("switch"));

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(true);
    });
});