import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll } from "vitest";

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "../app/components/ui/dialog";

beforeAll(() => {
    Element.prototype.scrollIntoView = () => { };
});

describe("Dialog", () => {
    it("renders the trigger", () => {
        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>

                <DialogContent>
                    <DialogTitle>My Dialog</DialogTitle>
                </DialogContent>
            </Dialog>
        );

        expect(
            screen.getByRole("button", { name: "Open Dialog" })
        ).toBeInTheDocument();
    });

    it("opens the dialog when the trigger is clicked", async () => {
        const user = userEvent.setup();

        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>

                <DialogContent>
                    <DialogTitle>My Dialog</DialogTitle>
                    <DialogDescription>
                        Dialog Description
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        );

        await user.click(
            screen.getByRole("button", { name: "Open Dialog" })
        );

        expect(
            screen.getByText("My Dialog")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Dialog Description")
        ).toBeInTheDocument();
    });

    it("closes the dialog when the close button is clicked", async () => {
        const user = userEvent.setup();

        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>

                <DialogContent>
                    <DialogTitle>My Dialog</DialogTitle>
                </DialogContent>
            </Dialog>
        );

        await user.click(
            screen.getByRole("button", { name: "Open Dialog" })
        );

        expect(
            screen.getByText("My Dialog")
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Close" })
        );

        expect(
            screen.queryByText("My Dialog")
        ).not.toBeInTheDocument();
    });

    it("renders title and description", async () => {
        const user = userEvent.setup();

        render(
            <Dialog>
                <DialogTrigger>Open Dialog</DialogTrigger>

                <DialogContent>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        );

        await user.click(
            screen.getByRole("button", { name: "Open Dialog" })
        );

        expect(
            screen.getByText("Settings")
        ).toBeInTheDocument();

        expect(
            screen.getByText("Manage your account settings")
        ).toBeInTheDocument();
    });
});