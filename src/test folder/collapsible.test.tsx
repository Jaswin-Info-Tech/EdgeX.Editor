import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../app/components/ui/collapsible";


describe("Collapsible", () => {
  it("renders the trigger", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(
      screen.getByRole("button", { name: "Toggle" })
    ).toBeInTheDocument();
  });


  it("shows the content when open is true", () => {
    render(
      <Collapsible open>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });


  it("calls onOpenChange when the trigger is clicked", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );

    await user.click(
      screen.getByRole("button", { name: "Toggle" })
    );

    expect(handleOpenChange).toHaveBeenCalledTimes(1);
  });


  it("renders content when opened after clicking the trigger", async () => {
    const user = userEvent.setup();

    function TestComponent() {
      const [open, setOpen] = useState(false);

      return (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      );
    }

    render(<TestComponent />);

    expect(
      screen.queryByText("Content")
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Toggle" })
    );

    expect(
      screen.getByText("Content")
    ).toBeInTheDocument();
  });
}); // 