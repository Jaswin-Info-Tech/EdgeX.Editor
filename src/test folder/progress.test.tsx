import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "../app/components/ui/progress";

describe("Progress", () => {
    it("renders the progress component", () => {
        const { container } = render(<Progress value={50} />);

        expect(
            container.querySelector('[data-slot="progress"]')
        ).toBeInTheDocument();
    });

    it("renders the progress indicator", () => {
        const { container } = render(<Progress value={50} />);

        expect(
            container.querySelector('[data-slot="progress-indicator"]')
        ).toBeInTheDocument();
    });

    it("applies the correct transform for value 50", () => {
        const { container } = render(<Progress value={50} />);

        const indicator = container.querySelector(
            '[data-slot="progress-indicator"]'
        ) as HTMLElement;

        expect(indicator.style.transform).toBe("translateX(-50%)");
    });

    it("applies the correct transform for value 100", () => {
        const { container } = render(<Progress value={100} />);

        const indicator = container.querySelector(
            '[data-slot="progress-indicator"]'
        ) as HTMLElement;

        expect(indicator.style.transform).toBe("translateX(-0%)");
    });

    it("defaults to 0 when no value is provided", () => {
        const { container } = render(<Progress />);

        const indicator = container.querySelector(
            '[data-slot="progress-indicator"]'
        ) as HTMLElement;

        expect(indicator.style.transform).toBe("translateX(-100%)");
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <Progress value={25} className="custom-progress" />
        );

        expect(container.querySelector(".custom-progress")).toBeInTheDocument();
    });

    it("passes additional props to the root element", () => {
        const { container } = render(
            <Progress value={40} data-testid="progress-bar" />
        );

        expect(container.querySelector('[data-testid="progress-bar"]')).toBeInTheDocument();
    });
});