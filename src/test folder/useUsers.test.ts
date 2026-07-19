import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUsers } from "../app/hooks/useUsers";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../app/api/users";// Mock React Query

vi.mock("@tanstack/react-query", () => ({
    useQuery: vi.fn(),
}));

// Mock API
vi.mock("../app/api/users", () => ({
  getUsers: vi.fn(),
}));

describe("useUsers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls useQuery with the correct configuration", () => {
        const mockResult = {
            data: [],
            isLoading: false,
            error: null,
        };

        (useQuery as any).mockReturnValue(mockResult);

        const { result } = renderHook(() => useUsers());

        expect(useQuery).toHaveBeenCalledWith({
            queryKey: ["users"],
            queryFn: expect.any(Function),
        });

        expect(result.current).toEqual(mockResult);
    });

    it("returns loading state", () => {
        const loadingResult = {
            data: undefined,
            isLoading: true,
            error: null,
        };

        (useQuery as any).mockReturnValue(loadingResult);

        const { result } = renderHook(() => useUsers());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
    });

    it("returns fetched users", () => {
        const users = [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
        ];

        const successResult = {
            data: users,
            isLoading: false,
            error: null,
        };

        (useQuery as any).mockReturnValue(successResult);

        const { result } = renderHook(() => useUsers());

        expect(result.current.data).toEqual(users);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("returns error state", () => {
        const error = new Error("Failed to fetch users");

        const errorResult = {
            data: undefined,
            isLoading: false,
            error,
        };

        (useQuery as any).mockReturnValue(errorResult);

        const { result } = renderHook(() => useUsers());

        expect(result.current.error).toBe(error);
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
    });

    it("calls useQuery exactly once", () => {
        (useQuery as any).mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
        });

        renderHook(() => useUsers());

        expect(useQuery).toHaveBeenCalledTimes(1);
    });
});