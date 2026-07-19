import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { usePackageUpload } from "../app/hooks/usePackageUpload";
import { postUploadPackages } from "../app/api/PackageUpload";

vi.mock("../app/api/PackageUpload", () => ({
  postUploadPackages: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  return {
    invalidateSpy,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      ),
  };
}

describe("usePackageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads package successfully", async () => {
    vi.mocked(postUploadPackages).mockResolvedValue({ success: true } as any);

    const { wrapper, invalidateSpy } = createWrapper();

    const { result } = renderHook(() => usePackageUpload(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({} as any);
    });

    expect(postUploadPackages).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["packages"],
      });
    });
  });

  it("handles upload failure", async () => {
    vi.mocked(postUploadPackages).mockRejectedValue(
      new Error("Upload failed")
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePackageUpload(), {
      wrapper,
    });

    await expect(result.current.mutateAsync({} as any)).rejects.toThrow(
      "Upload failed"
    );

    expect(postUploadPackages).toHaveBeenCalledTimes(1);
  });
});