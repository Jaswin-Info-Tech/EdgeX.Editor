import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll } from "vitest";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../app/components/ui/select";


beforeAll(() => {

    Element.prototype.hasPointerCapture = () => false;

    Element.prototype.setPointerCapture = () => { };

    Element.prototype.releasePointerCapture = () => { };

    Element.prototype.scrollIntoView = () => { };

});


describe("Select", () => {


    it("renders select trigger", () => {

        render(
            <Select>

                <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                </SelectTrigger>

            </Select>
        );


        expect(
            screen.getByText("Select option")
        ).toBeInTheDocument();

    });



    it("opens select options when clicked", async () => {

        const user = userEvent.setup();


        render(
            <Select>

                <SelectTrigger>
                    <SelectValue placeholder="Choose item" />
                </SelectTrigger>


                <SelectContent>

                    <SelectItem value="apple">
                        Apple
                    </SelectItem>

                    <SelectItem value="banana">
                        Banana
                    </SelectItem>

                </SelectContent>

            </Select>
        );


        await user.click(
            screen.getByRole("combobox")
        );


        expect(
            screen.getByText("Apple")
        ).toBeInTheDocument();


        expect(
            screen.getByText("Banana")
        ).toBeInTheDocument();

    });



    it("selects an option", async () => {

        const user = userEvent.setup();


        render(
            <Select>

                <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                </SelectTrigger>


                <SelectContent>

                    <SelectItem value="react">
                        React
                    </SelectItem>


                    <SelectItem value="angular">
                        Angular
                    </SelectItem>


                </SelectContent>

            </Select>
        );


        await user.click(
            screen.getByRole("combobox")
        );


        await user.click(
            screen.getByText("React")
        );


        expect(
            screen.getByText("React")
        ).toBeInTheDocument();

    });



    it("disables select trigger", () => {

        render(
            <Select disabled>

                <SelectTrigger>
                    <SelectValue placeholder="Disabled" />
                </SelectTrigger>

            </Select>
        );


        expect(
            screen.getByRole("combobox")
        ).toBeDisabled();

    });


});