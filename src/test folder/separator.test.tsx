import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "../app/components/ui/separator";

describe("Separator", () => {
    it("renders the separator", () => {
        const { container } = render(<Separator />);

        expect(
            container.querySelector('[data-slot="separator-root"]')
        ).toBeInTheDocument();
    });

    it("renders with horizontal orientation by default", () => {
        const { container } = render(<Separator />);

        expect(
            container.querySelector('[data-slot="separator-root"]')
        ).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders with vertical orientation", () => {
        const { container } = render(
            <Separator orientation="vertical" />
        );

        expect(
            container.querySelector('[data-slot="separator-root"]')
        ).toHaveAttribute("data-orientation", "vertical");
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <Separator className="custom-separator" />
        );

        expect(
            container.querySelector(".custom-separator")
        ).toBeInTheDocument();
    });

    it("accepts decorative={false}", () => {
        const { container } = render(
            <Separator decorative={false} />
        );

        expect(
            container.querySelector('[role="separator"]')
        ).toBeInTheDocument();
    });
});