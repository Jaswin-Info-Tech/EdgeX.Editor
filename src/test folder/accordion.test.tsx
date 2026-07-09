import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "../app/components/ui/accordion";

describe("Accordion", () => {
    it("renders the accordion trigger", () => {
        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Section 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        expect(
            screen.getByRole("button", { name: /section 1/i })
        ).toBeInTheDocument();
    });

    it("shows the content when the trigger is clicked", async () => {
        const user = userEvent.setup();

        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Section 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        await user.click(screen.getByRole("button", { name: /section 1/i }));

        expect(screen.getByText("Content 1")).toBeVisible();
    });

    it("hides the content when the trigger is clicked again", async () => {
        const user = userEvent.setup();

        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Section 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        const trigger = screen.getByRole("button", { name: /section 1/i });

        await user.click(trigger);
        expect(screen.getByText("Content 1")).toBeVisible();

        await user.click(trigger);

        expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("renders multiple accordion items", () => {
        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>First</AccordionTrigger>
                    <AccordionContent>First Content</AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger>Second</AccordionTrigger>
                    <AccordionContent>Second Content</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        expect(
            screen.getByRole("button", { name: /first/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /second/i })
        ).toBeInTheDocument();
    });

    it("applies a custom className to AccordionItem", () => {
        const { container } = render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="custom-item">
                    <AccordionTrigger>Section</AccordionTrigger>
                    <AccordionContent>Content</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        expect(container.querySelector(".custom-item")).toBeInTheDocument();
    });

    it("applies a custom className to AccordionContent", async () => {
        const user = userEvent.setup();

        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Section</AccordionTrigger>
                    <AccordionContent className="custom-content">
                        Content
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        await user.click(screen.getByRole("button", { name: /section/i }));

        expect(document.querySelector(".custom-content")).toBeInTheDocument();
    });
});