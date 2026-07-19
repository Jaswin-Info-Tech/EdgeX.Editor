import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeAll, vi } from "vitest";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "../app/components/ui/command";


beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };

  Element.prototype.scrollIntoView = () => { };
});


describe("Command", () => {
  it("renders command input", () => {
    render(
      <Command>
        <CommandInput placeholder="Search commands..." />
      </Command>
    );

    expect(
      screen.getByPlaceholderText("Search commands...")
    ).toBeInTheDocument();
  });


  it("allows typing in command input", async () => {
    const user = userEvent.setup();

    render(
      <Command>
        <CommandInput placeholder="Search commands..." />
      </Command>
    );

    const input = screen.getByPlaceholderText("Search commands...");

    await user.type(input, "Profile");

    expect(input).toHaveValue("Profile");
  });


  it("renders command items", () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>Profile</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandList>
      </Command>
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });


  it("calls item selection when clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <Command>
        <CommandList>
          <CommandItem onSelect={handleSelect}>
            Open Profile
          </CommandItem>
        </CommandList>
      </Command>
    );

    await user.click(
      screen.getByText("Open Profile")
    );

    expect(handleSelect).toHaveBeenCalledTimes(1);
  });


  it("shows empty message when no command exists", () => {
    render(
      <Command>
        <CommandEmpty>
          No results found
        </CommandEmpty>
      </Command>
    );

    expect(
      screen.getByText("No results found")
    ).toBeInTheDocument();
  });
});