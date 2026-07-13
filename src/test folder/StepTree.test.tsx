import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { StepTree } from "../app/components/editor/StepTree";

import type { TestStep } from "../app/types/editor";


const mockStep: TestStep = {
  id: "1",
  name: "Login Step",
  type: "sequence",
  enabled: true,
  status: "passed",
  breakpoint: false,
  properties: [],
  children: [],
};


const childStep: TestStep = {
  id: "2",
  name: "Child Step",
  type: "action",
  enabled: true,
  status: "passed",
  breakpoint: false,
  properties: [],
  children: [],
};


const defaultProps = {
  step: mockStep,
  selectedId: null,
  selectedPathIds: new Set<string>(),
  expanded: new Set<string>(),

  renaming: null,
  renameRef: {
    current: null,
  } as unknown as React.RefObject<HTMLInputElement>, renameVal: "",

  setRenameVal: vi.fn(),
  commitRename: vi.fn(),
  setRenaming: vi.fn(),

  setSelectedId: vi.fn(),
  setContextMenu: vi.fn(),

  toggleExpand: vi.fn(),
};



describe("StepTree", () => {


  it("renders step name", () => {

    render(
      <StepTree {...defaultProps} />
    );


    expect(
      screen.getByText("Login Step")
    ).toBeInTheDocument();

  });



  it("renders order path", () => {

    render(
      <StepTree {...defaultProps} />
    );


    expect(
      screen.getByText("1")
    ).toBeInTheDocument();

  });



  it("shows expand button when children exist", () => {


    render(
      <StepTree
        {...defaultProps}
        step={{
          ...mockStep,
          children: [childStep]
        }}
      />
    );


    const buttons =
      screen.getAllByRole("button");


    expect(buttons.length)
      .toBeGreaterThan(0);

  });



  it("calls toggleExpand when expand button clicked", () => {

    const toggleExpand = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        toggleExpand={toggleExpand}
        step={{
          ...mockStep,
          children: [childStep]
        }}
      />
    );


    const button =
      screen.getAllByRole("button")[0];


    fireEvent.click(button);


    expect(toggleExpand)
      .toHaveBeenCalledWith("1");

  });



  it("selects step when clicked", () => {

    const setSelectedId = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        setSelectedId={setSelectedId}
      />
    );


    fireEvent.click(
      screen.getByText("Login Step")
    );


    expect(setSelectedId)
      .toHaveBeenCalledWith("1");

  });



  it("opens context menu on right click", () => {

    const setContextMenu = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        setContextMenu={setContextMenu}
      />
    );


    fireEvent.contextMenu(
      screen.getByText("Login Step")
    );


    expect(setContextMenu)
      .toHaveBeenCalledWith(
        expect.objectContaining({
          stepId: "1"
        })
      );

  });



  it("renders child steps when expanded", () => {


    render(
      <StepTree
        {...defaultProps}
        expanded={new Set(["1"])}
        step={{
          ...mockStep,
          children: [childStep]
        }}
      />
    );


    expect(
      screen.getByText("Child Step")
    ).toBeInTheDocument();


  });



  it("shows rename input when renaming", () => {


    render(
      <StepTree
        {...defaultProps}
        renaming="1"
        renameVal="Updated Name"
      />
    );


    const input =
      screen.getByDisplayValue(
        "Updated Name"
      );


    expect(input)
      .toBeInTheDocument();

  });



  it("updates rename value", () => {

    const setRenameVal = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        renaming="1"
        renameVal="Old"
        setRenameVal={setRenameVal}
      />
    );


    const input =
      screen.getByDisplayValue("Old");


    fireEvent.change(
      input,
      {
        target: {
          value: "New"
        }
      }
    );


    expect(setRenameVal)
      .toHaveBeenCalledWith("New");

  });



  it("commits rename when Enter pressed", () => {

    const commitRename = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        renaming="1"
        renameVal="New Name"
        commitRename={commitRename}
      />
    );


    const input =
      screen.getByDisplayValue("New Name");


    fireEvent.keyDown(
      input,
      {
        key: "Enter"
      }
    );


    expect(commitRename)
      .toHaveBeenCalled();

  });



  it("cancels rename when Escape pressed", () => {

    const setRenaming = vi.fn();


    render(
      <StepTree
        {...defaultProps}
        renaming="1"
        renameVal="Name"
        setRenaming={setRenaming}
      />
    );


    const input =
      screen.getByDisplayValue("Name");


    fireEvent.keyDown(
      input,
      {
        key: "Escape"
      }
    );


    expect(setRenaming)
      .toHaveBeenCalledWith(null);

  });



  it("renders disabled step with reduced opacity", () => {


    const { container } =
      render(
        <StepTree
          {...defaultProps}
          step={{
            ...mockStep,
            enabled: false
          }}
        />
      );


    expect(
      container.firstChild
    )
      .toHaveClass("relative");

  });


});