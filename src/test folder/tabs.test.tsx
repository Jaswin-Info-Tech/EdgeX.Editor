import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "../app/components/ui/tabs";

describe("Tabs", () => {
    it("renders the tabs", () => {
        const { container } = render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">Content 1</TabsContent>
            </Tabs>
        );

        expect(
            container.querySelector('[data-slot="tabs"]')
        ).toBeInTheDocument();
    });

    it("renders the tabs list", () => {
        const { container } = render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                </TabsList>
            </Tabs>
        );

        expect(
            container.querySelector('[data-slot="tabs-list"]')
        ).toBeInTheDocument();
    });

    it("renders triggers", () => {
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>
            </Tabs>
        );

        expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    });

    it("renders the active tab content", () => {
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>

                <TabsContent value="tab1">Content 1</TabsContent>
                <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
        );

        expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("switches tabs when clicked", async () => {
        const user = userEvent.setup();

        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                </TabsList>

                <TabsContent value="tab1">Content 1</TabsContent>
                <TabsContent value="tab2">Content 2</TabsContent>
            </Tabs>
        );

        await user.click(screen.getByRole("tab", { name: "Tab 2" }));

        expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("accepts a custom className for Tabs", () => {
        const { container } = render(
            <Tabs defaultValue="tab1" className="custom-tabs">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                </TabsList>
            </Tabs>
        );

        expect(container.querySelector(".custom-tabs")).toBeInTheDocument();
    });

    it("accepts a custom className for TabsList", () => {
        const { container } = render(
            <Tabs defaultValue="tab1">
                <TabsList className="custom-list">
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                </TabsList>
            </Tabs>
        );

        expect(container.querySelector(".custom-list")).toBeInTheDocument();
    });

    it("accepts a custom className for TabsTrigger", () => {
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger
                        value="tab1"
                        className="custom-trigger"
                    >
                        Tab 1
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        );

        expect(document.querySelector(".custom-trigger")).toBeInTheDocument();
    });

    it("accepts a custom className for TabsContent", () => {
        render(
            <Tabs defaultValue="tab1">
                <TabsList>
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                </TabsList>

                <TabsContent
                    value="tab1"
                    className="custom-content"
                >
                    Content
                </TabsContent>
            </Tabs>
        );

        expect(document.querySelector(".custom-content")).toBeInTheDocument();
    });
});