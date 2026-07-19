import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    ScrollArea,
    ScrollBar,
} from "../app/components/ui/scroll-area";


describe("ScrollArea", () => {

    it("renders children inside scroll area", () => {
        render(
            <ScrollArea>
                <div>Scrollable Content</div>
            </ScrollArea>
        );

        expect(
            screen.getByText("Scrollable Content")
        ).toBeInTheDocument();
    });


    it("renders scroll area viewport", () => {

        const { container } = render(
            <ScrollArea>
                <div>Content</div>
            </ScrollArea>
        );


        expect(
            container.querySelector(
                '[data-slot="scroll-area-viewport"]'
            )
        ).toBeInTheDocument();

    });


    it("renders horizontal ScrollBar component", () => {

        const { container } = render(
            <ScrollArea>
                <div style={{ width: "2000px" }}>
                    Wide Content
                </div>

                <ScrollBar orientation="horizontal" />

            </ScrollArea>
        );


        const scrollArea =
            container.querySelector(
                '[data-slot="scroll-area"]'
            );


        expect(scrollArea).toBeInTheDocument();

    });


});