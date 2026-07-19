import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "../app/components/ui/alert"; // Update the import path

describe("Alert", () => {
  it("renders the alert", () => {
    render(<Alert>Alert Message</Alert>);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Alert Message")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
      </Alert>
    );

    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <Alert>
        <AlertDescription>
          Something went wrong.
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders title and description together", () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          Please check your input.
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(
      screen.getByText("Please check your input.")
    ).toBeInTheDocument();
  });

  it("applies the destructive variant", () => {
    render(
      <Alert variant="destructive">
        Destructive Alert
      </Alert>
    );

    const alert = screen.getByRole("alert");

    expect(alert).toHaveClass("text-destructive");
  });

  it("applies a custom className", () => {
    render(
      <Alert className="custom-alert">
        Custom Alert
      </Alert>
    );

    expect(screen.getByRole("alert")).toHaveClass("custom-alert");
  });

  it("applies a custom className to AlertTitle", () => {
    render(
      <Alert>
        <AlertTitle className="custom-title">
          Title
        </AlertTitle>
      </Alert>
    );

    expect(screen.getByText("Title")).toHaveClass("custom-title");
  });

  it("applies a custom className to AlertDescription", () => {
    render(
      <Alert>
        <AlertDescription className="custom-description">
          Description
        </AlertDescription>
      </Alert>
    );

    expect(screen.getByText("Description")).toHaveClass(
      "custom-description"
    );
  });
});