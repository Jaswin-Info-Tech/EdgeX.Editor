import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

import propertiesReducer, {
    lockResolvedTypeName,
    clearSchemaCache,
    fetchStepSchema,
} from "./propertiesSlice";

import * as testPlanApi from "../../api/testplans";

vi.mock("../../api/testplans", () => ({
    getStepSchema: vi.fn(),
}));

describe("propertiesSlice", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the initial state", () => {
        const state = propertiesReducer(undefined, { type: "" });

        expect(state).toEqual({
            cache: {},
            resolvedTypeNames: {},
            loadingTypeName: null,
            errorsByTypeName: {},
        });
    });

    it("locks a resolved type name", () => {
        const state = propertiesReducer(
            undefined,
            lockResolvedTypeName({
                stepId: "step1",
                stepTypeName: "DelayStep",
            })
        );

        expect(state.resolvedTypeNames.step1).toBe("DelayStep");
    });

    it("does not overwrite an existing resolved type name", () => {
        const initialState = {
            cache: {},
            resolvedTypeNames: {
                step1: "OriginalType",
            },
            loadingTypeName: null,
            errorsByTypeName: {},
        };

        const state = propertiesReducer(
            initialState,
            lockResolvedTypeName({
                stepId: "step1",
                stepTypeName: "NewType",
            })
        );

        expect(state.resolvedTypeNames.step1).toBe("OriginalType");
    });

    it("clears schema cache", () => {
        const initialState = {
            cache: {
                DelayStep: { name: "Delay" },
            },
            resolvedTypeNames: {},
            loadingTypeName: null,
            errorsByTypeName: {
                DelayStep: "Error",
            },
        };

        const state = propertiesReducer(
            initialState,
            clearSchemaCache()
        );

        expect(state.cache).toEqual({});
        expect(state.errorsByTypeName).toEqual({});
    });

    it("sets loadingTypeName when fetchStepSchema is pending", () => {
        const action = {
            type: fetchStepSchema.pending.type,
            meta: {
                arg: "DelayStep",
            },
        };

        const state = propertiesReducer(undefined, action);

        expect(state.loadingTypeName).toBe("DelayStep");
    });

    it("stores schema when fetchStepSchema succeeds", () => {
        const action = {
            type: fetchStepSchema.fulfilled.type,
            payload: {
                stepTypeName: "DelayStep",
                data: {
                    properties: [],
                },
                fromCache: false,
            },
        };

        const state = propertiesReducer(undefined, action);

        expect(state.cache.DelayStep).toEqual({
            properties: [],
        });

        expect(state.errorsByTypeName.DelayStep).toBeNull();
        expect(state.loadingTypeName).toBeNull();
    });

    it("stores error when fetchStepSchema fails", () => {
        const action = {
            type: fetchStepSchema.rejected.type,
            payload: {
                stepTypeName: "DelayStep",
                error: "Network Error",
            },
        };

        const state = propertiesReducer(undefined, action);

        expect(state.errorsByTypeName.DelayStep).toBe(
            "Network Error"
        );

        expect(state.loadingTypeName).toBeNull();
    });

    it("fetches schema successfully", async () => {
        vi.mocked(testPlanApi.getStepSchema).mockResolvedValue({
            properties: [],
        });

        const store = configureStore({
            reducer: {
                properties: propertiesReducer,
            },
        });

        await (store.dispatch as any)(fetchStepSchema("DelayStep"));
        expect(testPlanApi.getStepSchema).toHaveBeenCalledWith(
            "DelayStep"
        );

        expect(store.getState().properties.cache.DelayStep).toEqual({
            properties: [],
        });
    });

    it("uses cached schema without calling API", async () => {
        const store = configureStore({
            reducer: {
                properties: propertiesReducer,
            },
            preloadedState: {
                properties: {
                    cache: {
                        DelayStep: {
                            properties: [],
                        },
                    },
                    resolvedTypeNames: {},
                    loadingTypeName: null,
                    errorsByTypeName: {},
                },
            },
        });

        await (store.dispatch as any)(fetchStepSchema("DelayStep"));

        expect(testPlanApi.getStepSchema).not.toHaveBeenCalled();

        expect(store.getState().properties.cache.DelayStep).toEqual({
            properties: [],
        });
    });

    it("stores an error when API call fails", async () => {
        vi.mocked(testPlanApi.getStepSchema).mockRejectedValue(
            new Error("Server Error")
        );

        const store = configureStore({
            reducer: {
                properties: propertiesReducer,
            },
        });

        await (store.dispatch as any)(fetchStepSchema("DelayStep"));

        expect(store.getState().properties.errorsByTypeName.DelayStep)
            .toContain("Server Error");
    });
});