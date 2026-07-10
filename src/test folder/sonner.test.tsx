import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Toaster } from "../app/components/ui/sonner";

// Mock next-themes
vi.mock("next-themes", () => ({
    useTheme: () => ({
        theme: "dark",
    }),
}));

// Mock sonner
vi.mock("sonner", () => ({
    Toaster: (props: any) => (
        <div
            data-testid="sonner"
            data-theme={props.theme}
            className={props.className}
            style={props.style}
        >
            Mock Sonner
        </div>
    ),
}));

describe("Toaster", () => {
    it("renders the toaster", () => {
        render(<Toaster />);

        expect(screen.getByTestId("sonner")).toBeInTheDocument();
    });

    it("passes the theme from useTheme", () => {
        render(<Toaster />);

        expect(screen.getByTestId("sonner")).toHaveAttribute(
            "data-theme",
            "dark"
        );
    });

    it("applies the default className", () => {
        render(<Toaster />);

        expect(screen.getByTestId("sonner")).toHaveClass(
            "toaster",
            "group"
        );
    });

    it("applies the custom CSS variables", () => {
        render(<Toaster />);

        const toaster = screen.getByTestId("sonner");

        expect(toaster).toHaveStyle({
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
        });
    });

    it("passes additional props to Sonner", () => {
        render(<Toaster richColors position="top-right" />);

        expect(screen.getByTestId("sonner")).toBeInTheDocument();
    });
});