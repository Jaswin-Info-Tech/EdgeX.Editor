/**
 * Tests for useMqttResultListener.
 *
 * Stack: Vitest + @testing-library/react (renderHook/act/waitFor).
 *   npm i -D vitest @testing-library/react jsdom
 * vitest.config.ts should set `test.environment = "jsdom"`.
 *
 * `mqtt` is mocked with a small EventEmitter-based fake client so tests can
 * manually fire "connect" / "message" / "close" / "error" and assert on the
 * hook's reaction, without touching a real broker or real WebSocket.
 *
 * Adjust the import paths below if this file isn't a sibling of the hook
 * (the hook is assumed to live at ../app/hooks/useMqttResultListener and to
 * import ../api/resources relative to itself, i.e. ../app/api/resources
 * from here).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { EventEmitter } from "node:events";

// ---------------------------------------------------------------------------
// Fake mqtt.js client
// ---------------------------------------------------------------------------

class FakeMqttClient extends EventEmitter {
  url: string;
  opts: any;
  ended = false;
  endForced: boolean | undefined;
  subscribeMock = vi.fn((_topic: string, cb?: (err: Error | null) => void) => {
    cb?.(null);
  });

  constructor(url: string, opts: any) {
    super();
    this.url = url;
    this.opts = opts;
  }

  subscribe(topic: string, cb?: (err: Error | null) => void) {
    return this.subscribeMock(topic, cb);
  }

  end(force?: boolean) {
    this.ended = true;
    this.endForced = force;
  }
}

const createdClients: FakeMqttClient[] = [];

const connectMock = vi.fn((url: string, opts: any) => {
  const client = new FakeMqttClient(url, opts);
  createdClients.push(client);
  return client;
});

vi.mock("mqtt", () => ({
  default: {
    connect: (...args: any[]) => (connectMock as any)(...args),
  },
}));

// ---------------------------------------------------------------------------
// Fake resources API
// ---------------------------------------------------------------------------

const resourcesApi = vi.hoisted(() => ({
  getResources: vi.fn(),
  extractTypeName: vi.fn((type: string) => type),
}));

vi.mock("../app/api/resources", () => ({
  getResources: resourcesApi.getResources,
  extractTypeName: resourcesApi.extractTypeName,
}));

import { useMqttResultListener } from "../app/hooks/useMqttResultListener";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validMqttResource = (overrides: Record<string, any> = {}) => ({
  type: "MqttResultListener",
  properties: {
    Server: "broker.local",
    Port: 1883,
    Topic: "results/#",
    Username: "",
    Password: "",
    UseTls: false,
    IsEnabled: true,
    ClientId: "",
    ...overrides,
  },
});

function lastClient(): FakeMqttClient {
  return createdClients[createdClients.length - 1];
}

beforeEach(() => {
  vi.clearAllMocks();
  createdClients.length = 0;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Config loading / warnings
// ---------------------------------------------------------------------------

describe("config loading", () => {
  it("does nothing (no fetch, no connect) when disabled", async () => {
    resourcesApi.getResources.mockResolvedValue([]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus, { enabled: false }));

    // give any stray microtasks a chance to run
    await Promise.resolve();

    expect(resourcesApi.getResources).not.toHaveBeenCalled();
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("warns when no MQTT result listener resource exists", async () => {
    resourcesApi.getResources.mockResolvedValue([{ type: "SomeOtherResource", properties: {} }]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith("WARN", "No MQTT result listener resource found.");
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("warns when the resource is missing Server/Topic", async () => {
    resourcesApi.getResources.mockResolvedValue([
      { type: "MqttResultListener", properties: { Server: "", Topic: "" } },
    ]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith(
        "WARN",
        "MQTT result listener is missing Server/Topic values.",
      );
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("logs an error if fetching resources rejects", async () => {
    resourcesApi.getResources.mockRejectedValue(new Error("network down"));
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith("ERROR", "Unable to load MQTT result listener config.");
    });
  });

  it("does not attempt to connect when the resource is explicitly disabled (IsEnabled: false)", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ IsEnabled: false })]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => expect(resourcesApi.getResources).toHaveBeenCalled());
    await Promise.resolve();

    expect(connectMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

describe("connection lifecycle", () => {
  it("connects to the default ws candidate and reports connect status", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    const [url] = connectMock.mock.calls[0];
    expect(url).toBe("ws://broker.local:8083/mqtt");

    act(() => {
      lastClient().emit("connect");
    });

    expect(onStatus).toHaveBeenCalledWith("INFO", "Connected to MQTT (ws://broker.local:8083/mqtt)");
    expect(lastClient().subscribeMock).toHaveBeenCalledWith("results/#", expect.any(Function));
    expect(onStatus).toHaveBeenCalledWith("INFO", "Subscribed to results/#");
  });

  it("uses wss when UseTls is set", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ UseTls: true })]);
    renderHook(() => useMqttResultListener());

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    expect(connectMock.mock.calls[0][0]).toBe("wss://broker.local:8083/mqtt");
  });

  it("reports a subscribe error without crashing", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    lastClient().subscribeMock.mockImplementationOnce((_t, cb) => cb?.(new Error("not authorized")));

    act(() => {
      lastClient().emit("connect");
    });

    expect(onStatus).toHaveBeenCalledWith("ERROR", "Subscribe failed: not authorized");
  });

  it("parses JSON message payloads and forwards them via onMessage", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onMessage = vi.fn();

    renderHook(() => useMqttResultListener(onMessage));
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    const payload = new TextEncoder().encode(JSON.stringify({ pass: true, value: 3.3 }));
    act(() => {
      lastClient().emit("message", "results/step1", payload);
    });

    expect(onMessage).toHaveBeenCalledWith("results/step1", { pass: true, value: 3.3 });
  });

  it("falls back to raw text for non-JSON message payloads", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onMessage = vi.fn();

    renderHook(() => useMqttResultListener(onMessage));
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    const payload = new TextEncoder().encode("plain text, not json");
    act(() => {
      lastClient().emit("message", "results/step1", payload);
    });

    expect(onMessage).toHaveBeenCalledWith("results/step1", "plain text, not json");
  });

  it("reports connection closed after a settled connection", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    act(() => {
      lastClient().emit("connect");
    });
    act(() => {
      lastClient().emit("close");
    });

    expect(onStatus).toHaveBeenCalledWith(
      "INFO",
      "MQTT connection closed (ws://broker.local:8083/mqtt).",
    );
  });

  it("reports no reachable endpoint when the only candidate closes before connecting", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    act(() => {
      // close fires before "connect" -> not settled -> tries next candidate;
      // there is only one candidate by default, so this exhausts the list.
      lastClient().emit("close");
    });

    expect(onStatus).toHaveBeenCalledWith(
      "ERROR",
      "No reachable MQTT WebSocket endpoint found on broker.local.",
    );
    expect(lastClient().ended).toBe(true);
    expect(lastClient().endForced).toBe(true);
  });

  it("falls back to the next candidate when mqtt.connect throws synchronously", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);
    const onStatus = vi.fn();

    connectMock.mockImplementationOnce(() => {
      throw new Error("bad url");
    });

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith(
        "ERROR",
        expect.stringContaining("Failed to open ws://broker.local:8083/mqtt: bad url"),
      );
    });

    // only one candidate exists by default, so after the throw it should
    // report exhaustion instead of trying to connect again.
    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith(
        "ERROR",
        "No reachable MQTT WebSocket endpoint found on broker.local.",
      );
    });
  });

  it("closes the active client on unmount", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);

    const { unmount } = renderHook(() => useMqttResultListener());
    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));

    act(() => {
      lastClient().emit("connect");
    });

    const client = lastClient();
    unmount();

    expect(client.ended).toBe(true);
    expect(client.endForced).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Server address validation
// ---------------------------------------------------------------------------

describe("server address validation", () => {
  it("rejects an out-of-range IPv4 address without attempting to connect", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ Server: "999.1.1.1" })]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith(
        "ERROR",
        'Invalid MQTT server address "999.1.1.1" from result listener resource. Check the Server field — likely a typo.',
      );
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("rejects a hostname with illegal characters", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ Server: "broker local!" })]);
    const onStatus = vi.fn();

    renderHook(() => useMqttResultListener(undefined, onStatus));

    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith(
        "ERROR",
        expect.stringContaining('Invalid MQTT server address "broker local!"'),
      );
    });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it("accepts a well-formed hostname", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ Server: "mqtt.example.com" })]);

    renderHook(() => useMqttResultListener());

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    expect(connectMock.mock.calls[0][0]).toBe("ws://mqtt.example.com:8083/mqtt");
  });

  it("accepts a valid IPv4 address", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ Server: "192.168.1.10" })]);

    renderHook(() => useMqttResultListener());

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    expect(connectMock.mock.calls[0][0]).toBe("ws://192.168.1.10:8083/mqtt");
  });
});

// ---------------------------------------------------------------------------
// Connect options
// ---------------------------------------------------------------------------

describe("connect options", () => {
  it("passes credentials, clientId, and a non-reconnecting timeout config", async () => {
    resourcesApi.getResources.mockResolvedValue([
      validMqttResource({ Username: "alice", Password: "secret", ClientId: "custom-id" }),
    ]);

    renderHook(() => useMqttResultListener());

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    const [, opts] = connectMock.mock.calls[0];

    expect(opts.username).toBe("alice");
    expect(opts.password).toBe("secret");
    expect(opts.connectTimeout).toBe(4000);
    expect(opts.reconnectPeriod).toBe(0);
    // frontend-generated clientId wins over the resource's ClientId as long
    // as it is non-empty (see FRONTEND_CLIENT_ID || config.clientId).
    expect(opts.clientId).toMatch(/^edgex-frontend-/);
  });

  it("omits username/password from the connect options when blank", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource({ Username: "", Password: "" })]);

    renderHook(() => useMqttResultListener());

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    const [, opts] = connectMock.mock.calls[0];

    expect(opts.username).toBeUndefined();
    expect(opts.password).toBeUndefined();
  });

  it("respects a custom wsPort/wsPath override", async () => {
    resourcesApi.getResources.mockResolvedValue([validMqttResource()]);

    renderHook(() => useMqttResultListener(undefined, undefined, { wsPort: 9001, wsPath: "/ws" }));

    await waitFor(() => expect(connectMock).toHaveBeenCalledTimes(1));
    expect(connectMock.mock.calls[0][0]).toBe("ws://broker.local:9001/ws");
  });
});