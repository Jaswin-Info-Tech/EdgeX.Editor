import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "../app/components/ui/avatar"; // Update the path if needed

describe("Avatar", () => {
    it("renders the avatar", () => {
        const { container } = render(
            <Avatar>
                <AvatarFallback>AB</AvatarFallback>
            </Avatar>
        );

        expect(
            container.querySelector('[data-slot="avatar"]')
        ).toBeTruthy();
    });

    it("renders the fallback content", () => {
        render(
            <Avatar>
                <AvatarFallback>AB</AvatarFallback>
            </Avatar>
        );

        expect(screen.getByText("AB")).toBeTruthy();
    });

    it("applies a custom className to Avatar", () => {
        const { container } = render(
            <Avatar className="custom-avatar">
                <AvatarFallback>AB</AvatarFallback>
            </Avatar>
        );

        expect(container.querySelector(".custom-avatar")).toBeTruthy();
    });

    it("applies a custom className to AvatarFallback", () => {
        const { container } = render(
            <Avatar>
                <AvatarFallback className="custom-fallback">
                    AB
                </AvatarFallback>
            </Avatar>
        );

        expect(container.querySelector(".custom-fallback")).toBeTruthy();
    });


});