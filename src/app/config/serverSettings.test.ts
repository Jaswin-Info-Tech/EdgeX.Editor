import { describe, it, expect, beforeEach, vi } from "vitest";
import { env } from './env';
vi.mock("../app/env", () => ({
    env: {
        API_URL: "http://localhost:5000",
    },
}));

import {
    SERVER_SETTINGS_STORAGE_KEY,
    getServerSettings,
    saveServerSettings,
    getActiveServerProfile,
    hasConfiguredServer,
} from "./serverSettings";

describe("serverSettings", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("returns fallback settings when localStorage is empty", () => {
        const settings = getServerSettings();

        expect(settings.servers).toHaveLength(1);
        expect(settings.activeServerId).toBe("env-default");
        expect(settings.servers[0].baseUrl).toBe(env.API_URL);
    });

    it("saves settings into localStorage", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: "Server 1",
                    baseUrl: "http://api.test.com",
                    apiKey: "abc",
                    licenseKey: "xyz",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: "1",
        };

        saveServerSettings(settings);

        const stored = JSON.parse(
            localStorage.getItem(SERVER_SETTINGS_STORAGE_KEY)!
        );

        expect(stored.activeServerId).toBe("1");
        expect(stored.servers).toHaveLength(1);
    });

    it("loads settings from localStorage", () => {
        const settings = {
            servers: [
                {
                    id: "2",
                    name: "Server 2",
                    baseUrl: "http://uat.test.com",
                    apiKey: "",
                    licenseKey: "",
                    environment: "UAT",
                },
            ],
            activeServerId: "2",
        };

        localStorage.setItem(
            SERVER_SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

        const result = getServerSettings();

        expect(result.activeServerId).toBe("2");
        expect(result.servers[0].name).toBe("Server 2");
    });

    it("returns the active server profile", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: "DEV",
                    baseUrl: "http://dev",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
                {
                    id: "2",
                    name: "PROD",
                    baseUrl: "http://prod",
                    apiKey: "",
                    licenseKey: "",
                    environment: "PROD" as const,
                },
            ],
            activeServerId: "2",
        };

        const profile = getActiveServerProfile(settings);

        expect(profile?.id).toBe("2");
        expect(profile?.name).toBe("PROD");
    });

    it("returns the first server when activeServerId is null", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: "DEV",
                    baseUrl: "http://dev",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: null,
        };

        const profile = getActiveServerProfile(settings);

        expect(profile?.id).toBe("1");
    });

    it("returns true when a configured server exists", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: "Server",
                    baseUrl: "http://localhost",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: "1",
        };

        expect(hasConfiguredServer(settings)).toBe(true);
    });

    it("returns false when there are no configured servers", () => {
        expect(
            hasConfiguredServer({
                servers: [],
                activeServerId: null,
            })
        ).toBe(false);
    });

    it("falls back when localStorage contains invalid JSON", () => {
        localStorage.setItem(SERVER_SETTINGS_STORAGE_KEY, "{invalid json");

        const settings = getServerSettings();

        expect(settings.servers).toHaveLength(1);
        expect(settings.activeServerId).toBe("env-default");
    });

    it("removes trailing slash from baseUrl when saving", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: "Server",
                    baseUrl: "http://localhost:5000///",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: "1",
        };

        const saved = saveServerSettings(settings);

        expect(saved.servers[0].baseUrl).toBe("http://localhost:5000");
    });

    it("defaults invalid environment to DEV", () => {
        localStorage.setItem(
            SERVER_SETTINGS_STORAGE_KEY,
            JSON.stringify({
                servers: [
                    {
                        id: "1",
                        name: "Test",
                        baseUrl: "http://localhost",
                        apiKey: "",
                        licenseKey: "",
                        environment: "INVALID",
                    },
                ],
                activeServerId: "1",
            })
        );

        const settings = getServerSettings();

        expect(settings.servers[0].environment).toBe("DEV");
    });

    it("uses the first server when activeServerId does not exist", () => {
        const settings = {
            servers: [
                {
                    id: "10",
                    name: "Primary",
                    baseUrl: "http://primary",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: "999",
        };

        const profile = getActiveServerProfile(settings);

        expect(profile?.id).toBe("10");
    });

    it("returns normalized settings from saveServerSettings", () => {
        const settings = {
            servers: [
                {
                    id: "1",
                    name: " Server ",
                    baseUrl: " http://localhost/// ",
                    apiKey: "",
                    licenseKey: "",
                    environment: "DEV" as const,
                },
            ],
            activeServerId: "1",
        };

        const result = saveServerSettings(settings);

        expect(result.servers[0].baseUrl).toBe("http://localhost");
        expect(result.servers[0].name).toBe("Server");
    });
});