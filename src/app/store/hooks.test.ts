import { describe, it, expect, vi } from "vitest";

vi.mock("react-redux", () => ({
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

import { useDispatch, useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "./hooks";

describe("redux hooks", () => {
  it("returns the dispatch function from useAppDispatch", () => {
    const dispatch = vi.fn();

    vi.mocked(useDispatch).mockReturnValue(dispatch);

    expect(useAppDispatch()).toBe(dispatch);
  });

  it("calls useSelector through useAppSelector", () => {
    const mockState = {
      auth: {
        user: { id: 1, name: "Kavya" },
        token: "token",
      },
    };

    vi.mocked(useSelector).mockImplementation((selector: any) =>
      selector(mockState)
    );

    const result = useAppSelector((state: any) => state.auth.user);

    expect(result).toEqual({
      id: 1,
      name: "Kavya",
    });
  });

  it("returns the selected token", () => {
    const mockState = {
      auth: {
        user: null,
        token: "abc123",
      },
    };

    vi.mocked(useSelector).mockImplementation((selector: any) =>
      selector(mockState)
    );

    const token = useAppSelector((state: any) => state.auth.token);

    expect(token).toBe("abc123");
  });
});