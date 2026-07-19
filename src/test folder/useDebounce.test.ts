import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useDebounce } from "../app/hooks/useDebounce"; // Update the path if needed

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("returns the initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("initial"));

        expect(result.current).toBe("initial");
    });

    it("updates the value only after the delay", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            {
                initialProps: { value: "A" },
            }
        );

        expect(result.current).toBe("A");

        rerender({ value: "B" });

        expect(result.current).toBe("A");

        act(() => {
            vi.advanceTimersByTime(499);
        });

        expect(result.current).toBe("A");

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(result.current).toBe("B");
    });

    it("cancels the previous timeout when the value changes quickly", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            {
                initialProps: { value: "A" },
            }
        );

        rerender({ value: "B" });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        rerender({ value: "C" });

        act(() => {
            vi.advanceTimersByTime(249);
        });

        expect(result.current).toBe("A");

        act(() => {
            vi.advanceTimersByTime(251);
        });

        expect(result.current).toBe("C");
    });

    it("uses the default delay of 350ms", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value),
            {
                initialProps: { value: "old" },
            }
        );

        rerender({ value: "new" });

        act(() => {
            vi.advanceTimersByTime(349);
        });

        expect(result.current).toBe("old");

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(result.current).toBe("new");
    });

    it("cleans up the timeout on unmount", () => {
        const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

        const { unmount } = renderHook(() => useDebounce("test"));

        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();

        clearTimeoutSpy.mockRestore();
    });
});