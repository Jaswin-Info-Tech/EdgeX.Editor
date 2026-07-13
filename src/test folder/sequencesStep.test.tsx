import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SequenceStep } from "../app/components/editor/SequenceStep";


describe("SequenceStep", () => {

  const mockStep = {
    id: 1,
    name: "Step 1",
    type: "action",
    properties: [
      {
        key: "instruction",
        value: "Test instruction",
      },
    ],
    children: [
      {
        id: 2,
        name: "Child Step",
        type: "action",
        properties: [],
        children: [],
      },
    ],
  } as any;


const defaultProps = {
  step: mockStep,

  parentId: null,
  idx: 0,
  orderPath: "1",

  selectedId: null,
  expanded: new Set<number>(),

  renaming: null,
  renameRef: { current: null },
  renameVal: "",

  setRenameVal: vi.fn(),
  commitRename: vi.fn(),
  setRenaming: vi.fn(),

  setSelectedId: vi.fn(),
  setContextMenu: vi.fn(),

  toggleExpand: vi.fn(),

  isTablet: false,
  setRightOpen: vi.fn(),

  dragLibItem: null,

  setPlan: vi.fn(),

  setAddStepParentId: vi.fn(),
  setAddStepIdx: vi.fn(),
  setShowAddStep: vi.fn(),

  draggedStepId: null,
  setDraggedStepId: vi.fn(),

  dropTarget: null,

  onStepDragStart: vi.fn(),

  onLibraryDragOverStep: vi.fn(),
  onLibraryDropOnStep: vi.fn(),

  onLibraryDragOverChildLane: vi.fn(),
  onLibraryDropOnChildLane: vi.fn(),

  handleStepReorder: vi.fn(),
};

  it("shows expand button when children exist", () => {

    render(
      <SequenceStep {...defaultProps} />
    );

    expect(
      screen.getByTestId("expand-button")
    ).toBeInTheDocument();

  });


  it("calls toggleExpand when expand button clicked", () => {

    const toggleExpand = vi.fn();

    render(
      <SequenceStep
        {...defaultProps}
        toggleExpand={toggleExpand}
      />
    );


    fireEvent.click(
      screen.getByTestId("expand-button")
    );


    expect(toggleExpand)
      .toHaveBeenCalledWith(1);

  });

});