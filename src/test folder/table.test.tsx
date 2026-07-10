import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
} from "../app/components/ui/table";

describe("Table", () => {
    it("renders a table", () => {
        render(
            <Table>
                <TableBody />
            </Table>
        );

        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renders the table container", () => {
        const { container } = render(
            <Table>
                <TableBody />
            </Table>
        );

        expect(
            container.querySelector('[data-slot="table-container"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <Table className="custom-table">
                <TableBody />
            </Table>
        );

        expect(document.querySelector(".custom-table")).toBeInTheDocument();
    });
});

describe("TableHeader", () => {
    it("renders the header", () => {
        const { container } = render(
            <table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                    </TableRow>
                </TableHeader>
            </table>
        );

        expect(
            container.querySelector('[data-slot="table-header"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <table>
                <TableHeader className="custom-header" />
            </table>
        );

        expect(container.querySelector(".custom-header")).toBeInTheDocument();
    });
});

describe("TableBody", () => {
    it("renders rows", () => {
        render(
            <table>
                <TableBody>
                    <TableRow>
                        <TableCell>Cell</TableCell>
                    </TableRow>
                </TableBody>
            </table>
        );

        expect(screen.getByText("Cell")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <table>
                <TableBody className="custom-body" />
            </table>
        );

        expect(container.querySelector(".custom-body")).toBeInTheDocument();
    });
});

describe("TableFooter", () => {
    it("renders footer content", () => {
        render(
            <table>
                <TableFooter>
                    <TableRow>
                        <TableCell>Total</TableCell>
                    </TableRow>
                </TableFooter>
            </table>
        );

        expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <table>
                <TableFooter className="custom-footer" />
            </table>
        );

        expect(container.querySelector(".custom-footer")).toBeInTheDocument();
    });
});

describe("TableRow", () => {
    it("renders a row", () => {
        const { container } = render(
            <table>
                <tbody>
                    <TableRow />
                </tbody>
            </table>
        );

        expect(
            container.querySelector('[data-slot="table-row"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <table>
                <tbody>
                    <TableRow className="custom-row" />
                </tbody>
            </table>
        );

        expect(container.querySelector(".custom-row")).toBeInTheDocument();
    });
});

describe("TableHead", () => {
    it("renders a header cell", () => {
        render(
            <table>
                <thead>
                    <tr>
                        <TableHead>Name</TableHead>
                    </tr>
                </thead>
            </table>
        );

        expect(screen.getByRole("columnheader")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <table>
                <thead>
                    <tr>
                        <TableHead className="custom-head">Name</TableHead>
                    </tr>
                </thead>
            </table>
        );

        expect(document.querySelector(".custom-head")).toBeInTheDocument();
    });
});

describe("TableCell", () => {
    it("renders a table cell", () => {
        render(
            <table>
                <tbody>
                    <tr>
                        <TableCell>Value</TableCell>
                    </tr>
                </tbody>
            </table>
        );

        expect(screen.getByRole("cell")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <table>
                <tbody>
                    <tr>
                        <TableCell className="custom-cell">Value</TableCell>
                    </tr>
                </tbody>
            </table>
        );

        expect(document.querySelector(".custom-cell")).toBeInTheDocument();
    });
});

describe("TableCaption", () => {
    it("renders a caption", () => {
        render(
            <Table>
                <TableCaption>Users</TableCaption>
                <TableBody />
            </Table>
        );

        expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <Table>
                <TableCaption className="custom-caption">
                    Users
                </TableCaption>
                <TableBody />
            </Table>
        );

        expect(document.querySelector(".custom-caption")).toBeInTheDocument();
    });
});

describe("Complete Table", () => {
    it("renders a complete table structure", () => {
        render(
            <Table>
                <TableCaption>Employees</TableCaption>

                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Age</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <TableRow>
                        <TableCell>John</TableCell>
                        <TableCell>25</TableCell>
                    </TableRow>
                </TableBody>

                <TableFooter>
                    <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>1</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByRole("table")).toBeInTheDocument();
        expect(screen.getByText("Employees")).toBeInTheDocument();
        expect(screen.getByText("John")).toBeInTheDocument();
        expect(screen.getByText("25")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });
});