import { waitFor } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
} from "../app/components/ui/hover-card";


beforeAll(() => {
    globalThis.ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    Element.prototype.scrollIntoView = () => { };
});


describe("HoverCard", () => {

    it("renders the trigger", () => {
        render(
            <HoverCard>
                <HoverCardTrigger>
                    Profile
                </HoverCardTrigger>

                <HoverCardContent>
                    User Information
                </HoverCardContent>
            </HoverCard>
        );


        expect(
            screen.getByText("Profile")
        ).toBeInTheDocument();
    });


    it("shows content when hovering over trigger", async () => {
        const user = userEvent.setup();


        render(
            <HoverCard>
                <HoverCardTrigger>
                    Profile
                </HoverCardTrigger>

                <HoverCardContent>
                    User Information
                </HoverCardContent>
            </HoverCard>
        );


        await user.hover(
            screen.getByText("Profile")
        );


        expect(
            await screen.findByText("User Information")
        ).toBeInTheDocument();

    });


    it("hides content when mouse leaves trigger", async () => {
        const user = userEvent.setup();

        render(
            <HoverCard
                openDelay={0}
                closeDelay={0}
            >
                <HoverCardTrigger>
                    Profile
                </HoverCardTrigger>

                <HoverCardContent>
                    User Information
                </HoverCardContent>
            </HoverCard>
        );


        const trigger = screen.getByText("Profile");


        await user.hover(trigger);


        expect(
            await screen.findByText("User Information")
        ).toBeInTheDocument();


        await user.unhover(trigger);


        expect(
            screen.queryByText("User Information")
        ).not.toBeInTheDocument();

    });

    it("renders custom hover card content", async () => {
        const user = userEvent.setup();


        render(
            <HoverCard>
                <HoverCardTrigger>
                    Account
                </HoverCardTrigger>

                <HoverCardContent>
                    <h2>
                        Account Details
                    </h2>

                    <p>
                        Manage your account
                    </p>
                </HoverCardContent>
            </HoverCard>
        );


        await user.hover(
            screen.getByText("Account")
        );


        expect(
            await screen.findByText("Account Details")
        ).toBeInTheDocument();


        expect(
            screen.getByText("Manage your account")
        ).toBeInTheDocument();

    });

});