import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "../app/components/ui/checkbox";

describe("Checkbox", () => {
  it("renders the checkbox", () => {
    render(<Checkbox aria-label="Accept Terms" />);

    expect(
      screen.getByRole("checkbox", { name: "Accept Terms" })
    ).toBeInTheDocument();
  });

  it("can be checked when clicked", async () => {
    const user = userEvent.setup();

    render(<Checkbox aria-label="Accept Terms" />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Accept Terms",
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("calls onCheckedChange when clicked", async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn();

    render(
      <Checkbox
        aria-label="Accept Terms"
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Accept Terms",
    });

    await user.click(checkbox);

    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
  });

  it("is disabled when the disabled prop is set", () => {
    render(<Checkbox aria-label="Disabled Checkbox" disabled />);

    expect(
      screen.getByRole("checkbox", {
        name: "Disabled Checkbox",
      })
    ).toBeDisabled();
  });

  it("accepts custom className", () => {
    render(
      <Checkbox
        aria-label="Styled Checkbox"
        className="custom-checkbox"
      />
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Styled Checkbox",
      })
    ).toHaveClass("custom-checkbox");
  });
});