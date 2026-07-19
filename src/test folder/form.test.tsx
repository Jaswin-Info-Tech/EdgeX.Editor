import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "../app/components/ui/form";


type FormValues = {
    username: string;
};


function TestForm({
    onSubmit = () => { },
}: {
    onSubmit?: (data: FormValues) => void;
}) {
    const form = useForm<FormValues>({
        defaultValues: {
            username: "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>

                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>

                            <FormLabel>
                                Username
                            </FormLabel>

                            <FormControl>
                                <input
                                    {...field}
                                    placeholder="Enter username"
                                />
                            </FormControl>

                            <FormDescription>
                                Enter your username
                            </FormDescription>

                            <FormMessage />

                        </FormItem>
                    )}
                />

                <button type="submit">
                    Submit
                </button>

            </form>
        </Form>
    );
}


describe("Form", () => {

    it("renders form label", () => {
        render(<TestForm />);

        expect(
            screen.getByText("Username")
        ).toBeInTheDocument();
    });


    it("renders form input control", () => {
        render(<TestForm />);

        expect(
            screen.getByPlaceholderText("Enter username")
        ).toBeInTheDocument();
    });


    it("renders form description", () => {
        render(<TestForm />);

        expect(
            screen.getByText("Enter your username")
        ).toBeInTheDocument();
    });


    it("updates input value when typed", async () => {
        const user = userEvent.setup();

        render(<TestForm />);

        const input =
            screen.getByPlaceholderText("Enter username");

        await user.type(input, "John");

        expect(input).toHaveValue("John");
    });


    it("submits form data", async () => {
        const user = userEvent.setup();

        const handleSubmit = vi.fn();

        render(
            <TestForm onSubmit={handleSubmit} />
        );


        await user.type(
            screen.getByPlaceholderText("Enter username"),
            "John"
        );


        await user.click(
            screen.getByRole("button", {
                name: "Submit",
            })
        );


        expect(handleSubmit)
            .toHaveBeenCalledWith(
                {
                    username: "John",
                },
                expect.anything()
            );
    });


    it("shows validation error message", async () => {
        function RequiredForm() {
            const form = useForm<FormValues>({
                defaultValues: {
                    username: "",
                },
            });

            return (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(() => { })}
                    >

                        <FormField
                            control={form.control}
                            name="username"
                            rules={{
                                required: "Username is required",
                            }}
                            render={({ field }) => (
                                <FormItem>

                                    <FormLabel>
                                        Username
                                    </FormLabel>

                                    <FormControl>
                                        <input
                                            {...field}
                                            placeholder="Username"
                                        />
                                    </FormControl>

                                    <FormMessage />

                                </FormItem>
                            )}
                        />

                        <button type="submit">
                            Submit
                        </button>

                    </form>
                </Form>
            );
        }


        const user = userEvent.setup();

        render(<RequiredForm />);


        await user.click(
            screen.getByRole("button", {
                name: "Submit",
            })
        );


        expect(
            await screen.findByText(
                "Username is required"
            )
        ).toBeInTheDocument();

    });

});