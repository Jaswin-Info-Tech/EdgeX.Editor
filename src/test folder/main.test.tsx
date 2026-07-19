import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock App
vi.mock("./app/App.tsx", () => ({
  default: () => <div data-testid="app">Mock App</div>,
}));

vi.mock("react-redux", async () => {
  const actual = await vi.importActual<typeof import("react-redux")>(
    "react-redux"
  );

  return {
    ...actual,
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="provider">{children}</div>
    ),
    useDispatch: vi.fn(() => vi.fn()),
    useSelector: vi.fn((selector) =>
      selector({
        // minimal mock redux state
      })
    ),
  };
});

// Mock React Query Provider
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );

  return {
    ...actual,
    QueryClientProvider: ({ children }: any) => children,
  };
});

// Mock query client
vi.mock("./app/api/queryClient.ts", () => ({
  queryClient: {},
}));

// Mock redux store
vi.mock("./app/store/index.ts", () => ({
  store: {},
}));

const renderMock = vi.fn();

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({
    render: renderMock,
  })),
}));

describe("main.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    document.body.innerHTML = '<div id="root"></div>';
  });

  it("creates the root and renders the application", async () => {
    await import("../main");

    const { createRoot } = await import("react-dom/client");

    expect(createRoot).toHaveBeenCalledWith(
      document.getElementById("root")
    );

    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});