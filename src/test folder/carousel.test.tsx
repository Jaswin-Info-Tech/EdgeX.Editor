import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../app/components/ui/carousel";

// Mock Embla
vi.mock("embla-carousel-react", () => {
  const api = {
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    canScrollPrev: () => true,
    canScrollNext: () => true,
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    default: () => [vi.fn(), api],
  };
});

describe("Carousel", () => {
  function TestCarousel() {
    return (
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>

        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  it("renders the carousel", () => {
    render(<TestCarousel />);

    expect(
      screen.getByRole("region", { name: "" })
    ).toBeTruthy();
  });

  it("renders carousel slides", () => {
    render(<TestCarousel />);

    expect(screen.getByText("Slide 1")).toBeTruthy();
    expect(screen.getByText("Slide 2")).toBeTruthy();
  });

  it("renders previous button", () => {
    render(<TestCarousel />);

    expect(
      screen.getByRole("button", { name: /previous slide/i })
    ).toBeTruthy();
  });

  it("renders next button", () => {
    render(<TestCarousel />);

    expect(
      screen.getByRole("button", { name: /next slide/i })
    ).toBeTruthy();
  });

  it("clicks previous button", async () => {
    const user = userEvent.setup();

    render(<TestCarousel />);

    await user.click(
      screen.getByRole("button", { name: /previous slide/i })
    );
  });

  it("clicks next button", async () => {
    const user = userEvent.setup();

    render(<TestCarousel />);

    await user.click(
      screen.getByRole("button", { name: /next slide/i })
    );
  });

  it("applies custom className to Carousel", () => {
    const { container } = render(
      <Carousel className="custom-carousel">
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    expect(container.querySelector(".custom-carousel")).toBeTruthy();
  });

  it("applies custom className to CarouselContent", () => {
    const { container } = render(
      <Carousel>
        <CarouselContent className="custom-content">
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    expect(container.querySelector(".custom-content")).toBeTruthy();
  });

  it("applies custom className to CarouselItem", () => {
    const { container } = render(
      <Carousel>
        <CarouselContent>
          <CarouselItem className="custom-item">Slide</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    expect(container.querySelector(".custom-item")).toBeTruthy();
  });

  it("renders vertical orientation", () => {
    const { container } = render(
      <Carousel orientation="vertical">
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>
    );

    expect(container.querySelector('[data-slot="carousel"]')).toBeTruthy();
  });
});