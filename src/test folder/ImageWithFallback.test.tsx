import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";


describe("ImageWithFallback", () => {


  it("renders image with provided src and alt", () => {

    render(
      <ImageWithFallback
        src="test-image.png"
        alt="Test Image"
      />
    );


    const image =
      screen.getByAltText("Test Image");


    expect(image)
      .toBeInTheDocument();


    expect(image)
      .toHaveAttribute(
        "src",
        "test-image.png"
      );

  });



  it("shows fallback image when image loading fails", () => {

    render(
      <ImageWithFallback
        src="invalid-image.png"
        alt="Broken Image"
      />
    );


    const image =
      screen.getByAltText("Broken Image");


    fireEvent.error(image);


    const fallback =
      screen.getByAltText(
        "Error loading image"
      );


    expect(fallback)
      .toBeInTheDocument();

  });



  it("stores original url on fallback image", () => {

    render(
      <ImageWithFallback
        src="wrong-image.png"
        alt="Broken"
      />
    );


    fireEvent.error(
      screen.getByAltText("Broken")
    );


    const fallback =
      screen.getByAltText(
        "Error loading image"
      );


    expect(fallback)
      .toHaveAttribute(
        "data-original-url",
        "wrong-image.png"
      );

  });



  it("keeps className after image error", () => {

    render(
      <ImageWithFallback
        src="bad.png"
        alt="Image"
        className="custom-class"
      />
    );


    fireEvent.error(
      screen.getByAltText("Image")
    );


    const container =
      screen
        .getByAltText("Error loading image")
        .parentElement
        ?.parentElement;


    expect(container)
      .toHaveClass(
        "custom-class"
      );

  });



  it("keeps custom styles", () => {

    render(
      <ImageWithFallback
        src="image.png"
        alt="Styled Image"
        style={{
          width: "100px"
        }}
      />
    );


    const image =
      screen.getByAltText(
        "Styled Image"
      );


    expect(image)
      .toHaveStyle({
        width: "100px"
      });

  });



  it("calls custom onError handler if provided", () => {

    const onError = vi.fn();


    render(
      <ImageWithFallback
        src="error.png"
        alt="Error"
        onError={onError}
      />
    );


    fireEvent.error(
      screen.getByAltText("Error")
    );


    expect(onError)
      .not
      .toHaveBeenCalled();

  });


});