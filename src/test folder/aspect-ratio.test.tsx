import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AspectRatio } from "../app/components/ui/aspect-ratio"; // Update path if needed

describe("AspectRatio", () => {
  it("renders its children", () => {
    const { getByText } = render(
      <AspectRatio ratio={16 / 9}>
        <div>Content</div>
      </AspectRatio>
    );

    expect(getByText("Content")).toBeTruthy();
  });

  it("renders with the data-slot attribute", () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <div>Content</div>
      </AspectRatio>
    );

    expect(
      container.querySelector('[data-slot="aspect-ratio"]')
    ).toBeTruthy();
  });

  it("accepts a custom className", () => {
    const { container } = render(
      <AspectRatio ratio={1} className="custom-ratio">
        <div>Content</div>
      </AspectRatio>
    );

    expect(container.querySelector(".custom-ratio")).toBeTruthy();
  });

  it("accepts different ratio values", () => {
    const { container } = render(
      <AspectRatio ratio={4 / 3}>
        <div>Image</div>
      </AspectRatio>
    );

    expect(
      container.querySelector('[data-slot="aspect-ratio"]')
    ).toBeTruthy();
  });
});