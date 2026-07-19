import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { usePackages, useAvailablePackages } from "../app/hooks/usePackage";
import {
  getInstalledPackages,
  getAvailablePackages,
} from "../app/api/package";
import { createElement, ReactNode } from "react";

vi.mock("../app/api/package", () => ({
  getInstalledPackages: vi.fn(),
  getAvailablePackages: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
}
describe("usePackages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches installed packages", async () => {
    const packages = [
      { id: 1, name: "Package A" },
      { id: 2, name: "Package B" },
    ];

    vi.mocked(getInstalledPackages).mockResolvedValue(packages);

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getInstalledPackages).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(packages);
  });

  it("fetches available packages with search", async () => {
    const packages = [
      { id: 1, name: "Plugin One" },
    ];

    vi.mocked(getAvailablePackages).mockResolvedValue(packages);

    const { result } = renderHook(
      () => useAvailablePackages("plugin"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getAvailablePackages).toHaveBeenCalledWith("plugin");
    expect(result.current.data).toEqual(packages);
  });

  it("returns an empty array when API does not return an array", async () => {
    vi.mocked(getAvailablePackages).mockResolvedValue({} as any);

    const { result } = renderHook(
      () => useAvailablePackages("plugin"),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it("uses an empty search string by default", async () => {
    vi.mocked(getAvailablePackages).mockResolvedValue([]);

    renderHook(() => useAvailablePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(getAvailablePackages).toHaveBeenCalledWith("");
    });
  });

  it("handles installed package API errors", async () => {
    vi.mocked(getInstalledPackages).mockRejectedValue(
      new Error("API Error")
    );

    const { result } = renderHook(() => usePackages(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});