import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "../app/components/ui/pagination";

describe("Pagination", () => {
    it("renders the pagination navigation", () => {
        render(
            <Pagination>
                <PaginationContent />
            </Pagination>
        );

        expect(
            screen.getByRole("navigation", { name: /pagination/i })
        ).toBeInTheDocument();
    });

    it("renders pagination links", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );

        expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "2" })).toBeInTheDocument();
    });

    it("marks the active page", () => {
        render(<PaginationLink href="/page/1" isActive>
            1
        </PaginationLink>);

        expect(screen.getByRole("link")).toHaveAttribute(
            "aria-current",
            "page"
        );
    });

    it("renders the previous button", () => {
        render(<PaginationPrevious href="#" />);

        expect(
            screen.getByRole("link", {
                name: /go to previous page/i,
            })
        ).toBeInTheDocument();
    });

    it("renders the next button", () => {
        render(<PaginationNext href="#" />);

        expect(
            screen.getByRole("link", {
                name: /go to next page/i,
            })
        ).toBeInTheDocument();
    });

    it("renders the ellipsis", () => {
        render(<PaginationEllipsis />);

        expect(screen.getByText(/more pages/i)).toBeInTheDocument();
    });

    it("applies custom className to Pagination", () => {
        const { container } = render(
            <Pagination className="custom-pagination">
                <PaginationContent />
            </Pagination>
        );

        expect(
            container.querySelector(".custom-pagination")
        ).toBeInTheDocument();
    });

    it("applies custom className to PaginationContent", () => {
        const { container } = render(
            <Pagination>
                <PaginationContent className="custom-content" />
            </Pagination>
        );

        expect(
            container.querySelector(".custom-content")
        ).toBeInTheDocument();
    });

    it("applies custom className to PaginationLink", () => {
        const { container } = render(
            <PaginationLink className="custom-link" href="#">
                1
            </PaginationLink>
        );

        expect(
            container.querySelector(".custom-link")
        ).toBeInTheDocument();
    });

    it("applies custom className to PaginationEllipsis", () => {
        const { container } = render(
            <PaginationEllipsis className="custom-ellipsis" />
        );

        expect(
            container.querySelector(".custom-ellipsis")
        ).toBeInTheDocument();
    });
});