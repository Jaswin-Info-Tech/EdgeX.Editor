import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "../app/components/ui/context-menu";


describe("ContextMenu", () => {
  it("renders context menu trigger", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          Right Click Me
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem>
            Edit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    expect(
      screen.getByText("Right Click Me")
    ).toBeInTheDocument();
  });


  it("opens menu when trigger is right clicked", async () => {
    const user = userEvent.setup();

    render(
      <ContextMenu>
        <ContextMenuTrigger>
          Open Menu
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem>
            Copy
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );


    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByText("Open Menu"),
    });


    expect(
      screen.getByText("Copy")
    ).toBeInTheDocument();
  });


  it("calls item selection when clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();


    render(
      <ContextMenu>
        <ContextMenuTrigger>
          Menu
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onSelect={handleSelect}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );


    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByText("Menu"),
    });


    await user.click(
      screen.getByText("Delete")
    );


    expect(handleSelect).toHaveBeenCalledTimes(1);
  });


  it("renders checkbox item", async () => {
    const user = userEvent.setup();


    render(
      <ContextMenu>
        <ContextMenuTrigger>
          Settings
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuCheckboxItem checked>
            Show Toolbar
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    );


    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByText("Settings"),
    });


    expect(
      screen.getByText("Show Toolbar")
    ).toBeInTheDocument();
  });


  it("renders label and separator", async () => {
  const user = userEvent.setup();

  render(
    <ContextMenu>
      <ContextMenuTrigger>
        Menu
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuLabel>
          Actions
        </ContextMenuLabel>

        <ContextMenuSeparator />

        <ContextMenuItem>
          Open
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  await user.pointer({
    keys: "[MouseRight]",
    target: screen.getByText("Menu"),
  });

  expect(
    screen.getByText("Actions")
  ).toBeInTheDocument();

}); // closes it()


}); // closes describe()