import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll, vi } from "vitest";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "../app/components/ui/sheet";
beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };

    Element.prototype.scrollIntoView = () => { };
});

beforeAll(() => {

    Element.prototype.hasPointerCapture = () => false;

    Element.prototype.setPointerCapture = () => { };

    Element.prototype.releasePointerCapture = () => { };

    Element.prototype.scrollIntoView = () => { };

});


describe("Sheet", () => {


    it("renders sheet trigger", () => {

        render(
            <Sheet>

                <SheetTrigger>
                    Open Sheet
                </SheetTrigger>

            </Sheet>
        );


        expect(
            screen.getByText("Open Sheet")
        ).toBeInTheDocument();

    });



    it("opens sheet when trigger is clicked", async () => {

        const user = userEvent.setup();


        render(
            <Sheet>

                <SheetTrigger>
                    Open Sheet
                </SheetTrigger>


                <SheetContent>

                    <SheetTitle>
                        Settings
                    </SheetTitle>

                    <SheetDescription>
                        Manage your account settings
                    </SheetDescription>


                </SheetContent>


            </Sheet>
        );


        await user.click(
            screen.getByText("Open Sheet")
        );


        expect(
            screen.getByText("Settings")
        ).toBeInTheDocument();


        expect(
            screen.getByText(
                "Manage your account settings"
            )
        ).toBeInTheDocument();


    });



    it("renders sheet content", async () => {

        const user = userEvent.setup();


        render(
            <Sheet>

                <SheetTrigger>
                    Open
                </SheetTrigger>


                <SheetContent>

                    <div>
                        Sheet Content
                    </div>

                </SheetContent>


            </Sheet>
        );


        await user.click(
            screen.getByText("Open")
        );


        expect(
            screen.getByText("Sheet Content")
        ).toBeInTheDocument();


    });



    it("closes sheet using close button", async () => {
        const user = userEvent.setup();

        render(
            <Sheet>
                <SheetTrigger>
                    Open
                </SheetTrigger>

                <SheetContent>
                    <div>Profile</div>

                    <SheetClose>
                        Close
                    </SheetClose>

                </SheetContent>
            </Sheet>
        );


        await user.click(
            screen.getByRole("button", {
                name: "Open"
            })
        );


        expect(
            screen.getByText("Profile")
        ).toBeInTheDocument();


        const closeButton = document.querySelector(
            '[data-slot="sheet-close"]'
        );


        expect(closeButton).toBeInTheDocument();


        await user.click(closeButton!);


        expect(
            screen.queryByText("Profile")
        ).not.toBeInTheDocument();

    });

    it("renders sheet title and description", async () => {

        const user = userEvent.setup();


        render(
            <Sheet>

                <SheetTrigger>
                    Launch
                </SheetTrigger>


                <SheetContent>

                    <SheetTitle>
                        Account
                    </SheetTitle>


                    <SheetDescription>
                        User information
                    </SheetDescription>


                </SheetContent>


            </Sheet>
        );


        await user.click(
            screen.getByText("Launch")
        );


        expect(
            screen.getByText("Account")
        ).toBeInTheDocument();


        expect(
            screen.getByText("User information")
        ).toBeInTheDocument();


    });


});