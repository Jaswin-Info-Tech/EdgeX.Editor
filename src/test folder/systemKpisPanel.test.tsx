import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SystemKpisPanel } from "../app/components/editor/SystemKpisPanel";


// Mock hook
const mockRefetch = vi.fn();

vi.mock("../app/hooks/useSystem", () => ({
  useSystemKpis: vi.fn(),
}));

import { useSystemKpis } from "../app/hooks/useSystem";


// Mock recharts because jsdom cannot render charts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">
      {children}
    </div>
  ),
  LineChart: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div data-testid="line-chart" />,
  Area: () => <div data-testid="area-chart" />,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}));


const mockData = {
  machineName: "TEST-PC",
  osDescription: "Windows",
  osArchitecture: "x64",
  timestampUtc: "2026-07-13T10:00:00Z",

  uptimeSeconds: 3661,

  processorCount: 8,

  cpu: {
    usagePercent: 45.5,
    message: null,
  },

  memory: {
  usedMb: 4096,
  totalMb: 8192,
  availableMb: 2048,
  },

  process: {
    id: 1234,
    threads: 20,
    workingSetMb: 512.5,
    privateMemoryMb: 400,
    managedHeapBytes: 1024 * 1024 * 200,
    heapSizeBytes: 1024 * 1024 * 300,
    fragmentedBytes: 1024 * 1024 * 50,
    cpuTimeSeconds: 25.5,
    name: "EdgeX",
    totalAvailableMemoryBytes: 1024 * 1024 * 1024,
  },

  processArchitecture: "x64",
};


describe("SystemKpisPanel", () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });


  it("shows loading state", () => {

  vi.mocked(useSystemKpis).mockReturnValue({
    data: null,
    isLoading: true,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mockRefetch,
  } as any);


  render(
    <SystemKpisPanel
      isVisible={true}
      onClose={vi.fn()}
    />
  );


  expect(
    screen.getByText("Loading system KPIs...")
  ).toBeInTheDocument();

});


  it("shows error state and retry button", () => {

    vi.mocked(useSystemKpis).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error("API failed"),
      refetch: mockRefetch,
    } as any);


    render(
      <SystemKpisPanel
        isVisible={true}
        onClose={vi.fn()}
      />
    );


    expect(
      screen.getByText(
        "Unable to load system KPIs."
      )
    ).toBeInTheDocument();


    expect(
      screen.getByText("API failed")
    ).toBeInTheDocument();


    fireEvent.click(
      screen.getByText("Retry")
    );


    expect(mockRefetch)
      .toHaveBeenCalled();

  });



  it("renders system KPI details", () => {

    vi.mocked(useSystemKpis).mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);


    render(
      <SystemKpisPanel
        isVisible={true}
        onClose={vi.fn()}
      />
    );


    expect(
      screen.getByText("System Monitoring")
    ).toBeInTheDocument();


    expect(
      screen.getByText("TEST-PC")
    ).toBeInTheDocument();


    expect(
      screen.getByText("CPU Usage")
    ).toBeInTheDocument();


    expect(
      screen.getByText("45.5%")
    ).toBeInTheDocument();


    expect(
      screen.getByText("4096 MB")
    ).toBeInTheDocument();


    expect(
      screen.getByText("1h 1m 1s")
    ).toBeInTheDocument();

  });



  it("renders charts", () => {

    vi.mocked(useSystemKpis).mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as any);


    render(
      <SystemKpisPanel
        isVisible={true}
        onClose={vi.fn()}
      />
    );


    expect(
      screen.getAllByTestId(
        "responsive-container"
      )
    ).toHaveLength(2);

  });



  it("calls onClose when Back To Editor clicked", () => {

    const onClose = vi.fn();


    vi.mocked(useSystemKpis).mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    } as any);



    render(
      <SystemKpisPanel
        isVisible={true}
        onClose={onClose}
      />
    );


    fireEvent.click(
      screen.getByText("Back To Editor")
    );


    expect(onClose)
      .toHaveBeenCalled();

  });


});