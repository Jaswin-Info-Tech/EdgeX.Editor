import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWindowWidth } from "../app/hooks/useWindowWidth"; // Update path if needed

describe("useWindowWidth", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalWidth,
    });
  });

  it("returns the initial window width", () => {
    const { result } = renderHook(() => useWindowWidth());

    expect(result.current).toBe(1024);
  });

  it("updates the width when the window is resized", () => {
    const { result } = renderHook(() => useWindowWidth());

    act(() => {
      window.innerWidth = 768;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(768);
  });

  it("updates multiple times on resize", () => {
    const { result } = renderHook(() => useWindowWidth());

    act(() => {
      window.innerWidth = 900;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(900);

    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(500);
  });

  it("removes the resize event listener on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useWindowWidth());

    expect(addSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});