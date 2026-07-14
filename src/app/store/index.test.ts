import { describe, it, expect } from "vitest";

import { store } from "./index";
import { setLogin, logout } from "./slices/authSlice";
import {
  lockResolvedTypeName,
  clearSchemaCache,
} from "./slices/propertiesSlice";

describe("Redux Store", () => {
  it("creates the store with the expected reducers", () => {
    const state = store.getState();

    expect(state).toHaveProperty("auth");
    expect(state).toHaveProperty("properties");
  });

  it("initializes auth slice correctly", () => {
    const { auth } = store.getState();

    expect(auth.user).toBeNull();
    expect(auth.token).toBeNull();
  });

  it("initializes properties slice correctly", () => {
    const { properties } = store.getState();

    expect(properties.cache).toEqual({});
    expect(properties.resolvedTypeNames).toEqual({});
    expect(properties.loadingTypeName).toBeNull();
    expect(properties.errorsByTypeName).toEqual({});
  });

  it("updates auth state after login", () => {
    store.dispatch(
      setLogin({
        user: {
          id: 1,
          name: "Kavya",
        },
        token: "token123",
      })
    );

    const { auth } = store.getState();

    expect(auth.user).toEqual({
      id: 1,
      name: "Kavya",
    });

    expect(auth.token).toBe("token123");
  });

  it("clears auth state after logout", () => {
    store.dispatch(logout());

    const { auth } = store.getState();

    expect(auth.user).toBeNull();
    expect(auth.token).toBeNull();
  });

  it("updates properties state", () => {
    store.dispatch(
      lockResolvedTypeName({
        stepId: "step1",
        stepTypeName: "DelayStep",
      })
    );

    const { properties } = store.getState();

    expect(properties.resolvedTypeNames.step1).toBe("DelayStep");
  });

  it("clears properties cache", () => {
    store.dispatch(clearSchemaCache());

    const { properties } = store.getState();

    expect(properties.cache).toEqual({});
    expect(properties.errorsByTypeName).toEqual({});
  });
});