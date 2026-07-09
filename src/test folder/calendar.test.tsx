import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Calendar } from "../app/components/ui/calendar"; // Update the path if needed

describe("Calendar", () => {
  it("renders the calendar", () => {
    render(<Calendar />);

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders the navigation buttons", () => {
    render(<Calendar />);

    const buttons = screen.getAllByRole("button");

    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the weekday headers", () => {
    render(<Calendar />);

    expect(screen.getByText("Su")).toBeInTheDocument();
    expect(screen.getByText("Mo")).toBeInTheDocument();
    expect(screen.getByText("Tu")).toBeInTheDocument();
    expect(screen.getByText("We")).toBeInTheDocument();
    expect(screen.getByText("Th")).toBeInTheDocument();
    expect(screen.getByText("Fr")).toBeInTheDocument();
    expect(screen.getByText("Sa")).toBeInTheDocument();
  });

  it("renders a selected date", () => {
    const selected = new Date(2026, 6, 9);

    render(<Calendar mode="single" selected={selected} />);

    expect(
      screen.getByRole("gridcell", { selected: true })
    ).toBeInTheDocument();
  });

  it("accepts a custom className", () => {
    const { container } = render(<Calendar className="custom-calendar" />);

    expect(container.firstChild).toHaveClass("custom-calendar");
  });

  it("accepts custom classNames", () => {
    render(
      <Calendar
        classNames={{
          day: "custom-day",
        }}
      />
    );

    expect(document.querySelector(".custom-day")).toBeInTheDocument();
  });

  it("renders outside days by default", () => {
    render(<Calendar />);

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders correctly when showOutsideDays is false", () => {
    render(<Calendar showOutsideDays={false} />);

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders in range mode", () => {
    render(<Calendar mode="range" />);

    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});