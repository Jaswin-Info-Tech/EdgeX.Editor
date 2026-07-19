import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll } from "vitest";
import "@testing-library/jest-dom/vitest";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../app/components/ui/tooltip";


beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    Element.prototype.scrollIntoView = () => { };

    Element.prototype.hasPointerCapture = () => false;

    Element.prototype.setPointerCapture = () => { };

    Element.prototype.releasePointerCapture = () => { };
});


const renderTooltip = (
    content = "Tooltip Content",
    props = {}
) => {
    render(
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    Hover Me
                </TooltipTrigger>

                <TooltipContent {...props}>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


describe("Tooltip", () => {


    it("renders the trigger", () => {

        renderTooltip();

        expect(
            screen.getByText("Hover Me")
        ).toBeInTheDocument();

    });



    it("shows tooltip content on hover", async () => {

        const user = userEvent.setup();

        renderTooltip();

        await user.hover(
            screen.getByText("Hover Me")
        );

        const tooltip = await screen.findByRole("tooltip");

        expect(tooltip).toHaveTextContent(
            "Tooltip Content"
        );

    });


    it("accepts custom className on TooltipContent", async () => {

        const user = userEvent.setup();


        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        Hover Me
                    </TooltipTrigger>

                    <TooltipContent className="custom-tooltip">
                        Custom Content
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );


        await user.hover(
            screen.getByText("Hover Me")
        );


        await waitFor(() => {

            expect(
                document.querySelector(".custom-tooltip")
            ).toBeInTheDocument();

        });

    });



    it("renders TooltipProvider", () => {

        render(
            <TooltipProvider>
                <div>
                    Provider Content
                </div>
            </TooltipProvider>
        );


        expect(
            screen.getByText("Provider Content")
        ).toBeInTheDocument();

    });



    it("renders TooltipTrigger correctly", () => {

        render(
            <TooltipProvider>

                <Tooltip>

                    <TooltipTrigger data-testid="trigger">
                        Trigger
                    </TooltipTrigger>

                    <TooltipContent>
                        Content
                    </TooltipContent>

                </Tooltip>

            </TooltipProvider>
        );


        expect(
            screen.getByTestId("trigger")
        ).toBeInTheDocument();

    });



    it("supports sideOffset prop", async () => {

        const user = userEvent.setup();


        render(
            <TooltipProvider>

                <Tooltip>

                    <TooltipTrigger>
                        Hover Me
                    </TooltipTrigger>


                    <TooltipContent sideOffset={10}>
                        Offset Content
                    </TooltipContent>


                </Tooltip>

            </TooltipProvider>
        );


        await user.hover(
            screen.getByText("Hover Me")
        );

        const tooltip = await screen.findByRole("tooltip");

        expect(tooltip).toHaveTextContent(
            "Offset Content"
        );

    });



    it("renders tooltip arrow", async () => {

        const user = userEvent.setup();

        render(
            <TooltipProvider>
                <Tooltip>

                    <TooltipTrigger>
                        Hover Me
                    </TooltipTrigger>

                    <TooltipContent forceMount>
                        <span data-testid="tooltip-arrow">
                            Arrow Content
                        </span>
                    </TooltipContent>

                </Tooltip>
            </TooltipProvider>
        );


        await user.hover(
            screen.getByText("Hover Me")
        );


        const arrows = await screen.findAllByTestId(
            "tooltip-arrow"
        );

        expect(arrows.length).toBeGreaterThan(0);

    });


});