import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

import { useSystemKpis } from "../app/hooks/useSystem"; // update path
import { getSystemKpis } from "../app/api/system"; // update path


// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));


// Mock API
vi.mock("../app/api/system", () => ({
  getSystemKpis: vi.fn(),
}));


describe("useSystemKpis", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    (useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });


  it("calls useQuery with correct configuration", () => {

    renderHook(() => useSystemKpis());

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ["system-kpis"],
      queryFn: getSystemKpis,
      enabled: true,
      refetchInterval: 5000,
      staleTime: 2000,
    });

  });


  it("passes enabled=false correctly", () => {

    renderHook(() => useSystemKpis(false));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["system-kpis"],
        enabled: false,
      })
    );

  });


  it("uses enabled=true as default", () => {

    renderHook(() => useSystemKpis());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );

  });


  it("returns query result", () => {

    const mockResult = {
      data: {
        cpu: 20,
        memory: 40,
      },
      isLoading: false,
      error: null,
    };


    (useQuery as any).mockReturnValue(mockResult);


    const { result } = renderHook(() => useSystemKpis());


    expect(result.current).toEqual(mockResult);

  });


  it("calls getSystemKpis as query function", () => {

    renderHook(() => useSystemKpis());


    const queryConfig = (useQuery as any).mock.calls[0][0];


    expect(queryConfig.queryFn).toBe(getSystemKpis);

  });


});