import { render } from "@testing-library/react";
import { describe, expect, it, beforeAll } from "vitest";

import { Slider } from "../app/components/ui/slider";

beforeAll(() => {
    (globalThis as any).ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
});

describe("Slider", () => {
    it("renders the slider", () => {
        render(<Slider defaultValue={[50]} />);

        expect(
            document.querySelector('[data-slot="slider"]')
        ).toBeInTheDocument();
    });

    it("renders the track", () => {
        render(<Slider defaultValue={[50]} />);

        expect(
            document.querySelector('[data-slot="slider-track"]')
        ).toBeInTheDocument();
    });

    it("renders the range", () => {
        render(<Slider defaultValue={[50]} />);

        expect(
            document.querySelector('[data-slot="slider-range"]')
        ).toBeInTheDocument();
    });

    it("renders one thumb for a single value", () => {
        render(<Slider defaultValue={[50]} />);

        expect(
            document.querySelectorAll('[data-slot="slider-thumb"]')
        ).toHaveLength(1);
    });

    it("renders two thumbs for a range slider", () => {
        render(<Slider defaultValue={[20, 80]} />);

        expect(
            document.querySelectorAll('[data-slot="slider-thumb"]')
        ).toHaveLength(2);
    });

    it("accepts a custom className", () => {
        render(
            <Slider
                defaultValue={[50]}
                className="custom-slider"
            />
        );

        expect(document.querySelector(".custom-slider")).toBeInTheDocument();
    });

    it("accepts custom min and max values", () => {
        render(
            <Slider
                defaultValue={[25]}
                min={10}
                max={50}
            />
        );

        const slider = document.querySelector('[data-slot="slider"]');

        expect(slider).toHaveAttribute("data-slot", "slider");
    });

    it("renders correctly with a controlled value", () => {
        render(<Slider value={[40]} />);

        expect(
            document.querySelector('[data-slot="slider"]')
        ).toBeInTheDocument();
    });

    it("renders a vertical slider", () => {
        render(
            <Slider
                defaultValue={[50]}
                orientation="vertical"
            />
        );

        expect(
            document.querySelector('[data-slot="slider"]')
        ).toBeInTheDocument();
    });
});