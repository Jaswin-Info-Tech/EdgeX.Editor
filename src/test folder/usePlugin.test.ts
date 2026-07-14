import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

import {
  usePlugins,
  useInstruments,
  useInstalledPlugins,
  useDuts,
  useTestPlans,
  useConnections,
  useResultListeners,
  useTraceListeners,
} from "../app/hooks/usePlugin"; // update path


import {
  getSteps,
  getInstruments,
  getInstalledPlugins,
  getDuts,
  getConnections,
  getResultListeners,
  getTraceListeners,
} from "../app/api/plugin";

import { getTestPlans } from "../app/api/testplans";


// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));


// Mock APIs
vi.mock("../app/api/plugin", () => ({
  getSteps: vi.fn(),
  getInstruments: vi.fn(),
  getInstalledPlugins: vi.fn(),
  getDuts: vi.fn(),
  getConnections: vi.fn(),
  getResultListeners: vi.fn(),
  getTraceListeners: vi.fn(),
}));

vi.mock("../app/api/testplans", () => ({
  getTestPlans: vi.fn(),
}));


describe("Plugin Hooks", () => {

  beforeEach(() => {
    vi.clearAllMocks();

    (useQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
  });


  it("usePlugins calls useQuery with steps key", () => {

    renderHook(() => usePlugins());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["steps"],
      })
    );
  });



  it("useInstruments calls useQuery correctly", () => {

    renderHook(() => useInstruments());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["instruments"],
      })
    );
  });



  it("useInstalledPlugins uses search parameter", () => {

    renderHook(() => useInstalledPlugins("abc"));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "installed-plugins",
          "abc"
        ],
      })
    );
  });



  it("useDuts calls query with duts key", () => {

    renderHook(() => useDuts());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["duts"],
      })
    );
  });



  it("useTestPlans uses rootPath", () => {

    renderHook(() => useTestPlans("/tests"));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          "testplans",
          "/tests"
        ],
        enabled:true
      })
    );
  });



  it("useConnections calls query correctly", () => {

    renderHook(() => useConnections());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey:["connections"]
      })
    );
  });



  it("useResultListeners calls query correctly", () => {

    renderHook(() => useResultListeners());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey:[
          "result-listeners"
        ]
      })
    );
  });



  it("useTraceListeners calls query correctly", () => {

    renderHook(() => useTraceListeners());

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey:[
          "trace-listeners"
        ]
      })
    );
  });

});