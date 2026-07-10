import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "../app/components/ui/input-otp";
import { beforeAll } from "vitest";

beforeAll(() => {
    Object.defineProperty(globalThis, "ResizeObserver", {
        writable: true,
        configurable: true,
        value: class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        },
    });
});

describe("InputOTP", () => {
    it("renders the OTP input", () => {
        render(
            <InputOTP
                maxLength={6}
                render={({ slots }) => (
                    <>
                        {slots.map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </>
                )}
            />
        );

        expect(
            document.querySelector('[data-slot="input-otp"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <InputOTP
                maxLength={6}
                className="custom-input"
                render={({ slots }) => (
                    <>
                        {slots.map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </>
                )}
            />
        );

        expect(document.querySelector(".custom-input")).toBeInTheDocument();
    });

    it("accepts a custom containerClassName", () => {
        render(
            <InputOTP
                maxLength={6}
                containerClassName="custom-container"
                render={({ slots }) => (
                    <>
                        {slots.map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                        ))}
                    </>
                )}
            />
        );

        expect(document.querySelector(".custom-container")).toBeInTheDocument();
    });
});

describe("InputOTPGroup", () => {
    it("renders children", () => {
        render(
            <InputOTPGroup>
                <span>OTP Group</span>
            </InputOTPGroup>
        );

        expect(screen.getByText("OTP Group")).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        const { container } = render(
            <InputOTPGroup className="custom-group" />
        );

        expect(container.querySelector(".custom-group")).toBeInTheDocument();
    });
});

describe("InputOTPSlot", () => {
    it("renders without crashing", () => {
        render(<InputOTPSlot index={0} />);

        expect(
            document.querySelector('[data-slot="input-otp-slot"]')
        ).toBeInTheDocument();
    });

    it("accepts a custom className", () => {
        render(
            <InputOTPSlot
                index={0}
                className="custom-slot"
            />
        );

        expect(document.querySelector(".custom-slot")).toBeInTheDocument();
    });
});

describe("InputOTPSeparator", () => {
    it("renders the separator", () => {
        render(<InputOTPSeparator />);

        expect(screen.getByRole("separator")).toBeInTheDocument();
    });

    it("accepts custom props", () => {
        render(<InputOTPSeparator data-testid="separator" />);

        expect(screen.getByTestId("separator")).toBeInTheDocument();
    });
});