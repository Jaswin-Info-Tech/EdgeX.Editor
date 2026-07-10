import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "../app/components/ui/skeleton";

describe("Skeleton", () => {
    it("renders successfully", () => {
        render(<Skeleton />);

        expect(
            document.querySelector('[data-slot="skeleton"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(<Skeleton className="custom-skeleton" />);

        expect(document.querySelector(".custom-skeleton")).toBeInTheDocument();
    });

    it("renders children", () => {
        const { getByText } = render(
            <Skeleton>
                <span>Loading...</span>
            </Skeleton>
        );

        expect(getByText("Loading...")).toBeInTheDocument();
    });

    it("accepts additional props", () => {
        render(<Skeleton data-testid="skeleton" />);

        expect(document.querySelector('[data-testid="skeleton"]')).toBeInTheDocument();
    });

    it("has the default skeleton classes", () => {
        render(<Skeleton />);

        const skeleton = document.querySelector('[data-slot="skeleton"]');

        expect(skeleton).toHaveClass("bg-accent");
        expect(skeleton).toHaveClass("animate-pulse");
        expect(skeleton).toHaveClass("rounded-md");
    });
});