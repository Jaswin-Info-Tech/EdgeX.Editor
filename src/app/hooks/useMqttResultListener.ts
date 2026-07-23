import { useEffect, useRef, useState } from "react";
import mqtt from "mqtt";
import { getResources, extractTypeName } from "../api/resources";

const parsePayload = (payload: Uint8Array) => {
  const text = new TextDecoder().decode(payload);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

type MqttResourceConfig = {
  server: string;
  port: number;
  topic: string;
  username: string;
  password: string;
  useTls: boolean;
  isEnabled: boolean;
  clientId: string;
};

const extractMqttConfig = (
  properties: Record<string, any> | undefined,
): MqttResourceConfig | null => {
  if (!properties) return null;

  const server = String(properties.Server ?? "").trim();
  const topic = String(properties.Topic ?? "").trim();
  if (!server || !topic) return null;

  return {
    server,
    port: Number(properties.Port ?? 1883) || 1883,
    topic,
    username: String(properties.Username ?? ""),
    password: String(properties.Password ?? ""),
    useTls: Boolean(properties.UseTls),
    isEnabled: properties.IsEnabled !== false,
    clientId: String(properties.ClientId ?? ""),
  };
};

const FRONTEND_CLIENT_ID = `edgex-frontend-${Math.random().toString(16).slice(2, 10)}`;

const buildCandidateUrls = (config: MqttResourceConfig, override?: { port?: number; path?: string }) => {
  const protocol = config.useTls ? "wss" : "ws";
  if (override?.port) {
    return [`${protocol}://${config.server}:${override.port}${override.path ?? ""}`];
  }

  const candidates = [
    { port: 8083, path: "/mqtt" },
  ];

  const seen = new Set<number>();
  return candidates
    .filter((c) => (seen.has(c.port) ? false : (seen.add(c.port), true)))
    .map((c) => `${protocol}://${config.server}:${c.port}${c.path}`);
};

export const useMqttResultListener = (
  onMessage?: (topic: string, data: any) => void,
  onStatus?: (level: "INFO" | "WARN" | "ERROR", message: string) => void,
  options?: { enabled?: boolean; wsPort?: number; wsPath?: string },
) => {
  const enabled = options?.enabled ?? true;
  const onMessageRef = useRef(onMessage);
  const onStatusRef = useRef(onStatus);
  onMessageRef.current = onMessage;
  onStatusRef.current = onStatus;

  const [config, setConfig] = useState<MqttResourceConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const knownGoodUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsSubscribed(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const resources = await getResources();
        if (cancelled) return;

        const mqttResource = resources.find((resource: any) =>
          extractTypeName(String(resource.type ?? ""))
            .toLowerCase()
            .includes("mqttresultlistener"),
        );

        const resolved = extractMqttConfig(mqttResource?.properties);
        setConfig(resolved);

        if (!mqttResource) {
          onStatusRef.current?.("WARN", "No MQTT result listener resource found.");
        } else if (!resolved) {
          onStatusRef.current?.("WARN", "MQTT result listener is missing Server/Topic values.");
        }
      } catch {
        if (!cancelled) onStatusRef.current?.("ERROR", "Unable to load MQTT result listener config.");
      } finally {
        if (!cancelled) setConfigLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [enabled]);

  useEffect(() => {
    setIsSubscribed(false);
    if (!enabled || !configLoaded || !config || !config.isEnabled) return;

    let cancelled = false;
    let activeClient: ReturnType<typeof mqtt.connect> | null = null;

    const candidates = knownGoodUrlRef.current
      ? [knownGoodUrlRef.current, ...buildCandidateUrls(config, { port: options?.wsPort, path: options?.wsPath })]
      : buildCandidateUrls(config, { port: options?.wsPort, path: options?.wsPath });

    const connectOpts = {
      clientId: FRONTEND_CLIENT_ID || config.clientId,
      username: config.username || undefined,
      password: config.password || undefined,
      connectTimeout: 4000,
      reconnectPeriod: 0, // never auto-reconnect, on first connect or after disconnect
    };

    // Add this validator
    const isValidIPv4OrHostname = (host: string): boolean => {
      if (!host) return false;

      const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = host.match(ipv4Pattern);
      if (match) {
        // Every octet must be 0-255
        return match.slice(1, 5).every((octet) => {
          const n = Number(octet);
          return n >= 0 && n <= 255;
        });
      }

      // Not an IPv4 shape — allow it through as a hostname (basic sanity check only)
      const hostnamePattern = /^[a-zA-Z0-9.-]+$/;
      return hostnamePattern.test(host);
    };

    const tryNext = (index: number) => {
      if (cancelled) return;
      if (index >= candidates.length) {
        onStatusRef.current?.("ERROR", `No reachable MQTT WebSocket endpoint found on ${config.server}.`);
        return;
      }

      const brokerUrl = candidates[index];

      if (!isValidIPv4OrHostname(config.server)) {
        onStatusRef.current?.(
          "ERROR",
          `Invalid MQTT server address "${config.server}" from result listener resource. Check the Server field — likely a typo.`,
        );
        return; // don't attempt any candidate; the address itself is broken
      }

      let client: ReturnType<typeof mqtt.connect>;
      try {
        client = mqtt.connect(brokerUrl, connectOpts);
      } catch (err) {
        // mqtt.js / the browser's WebSocket constructor can throw synchronously
        // on a malformed URL — catch it here so it never crashes the React tree.
        onStatusRef.current?.("ERROR", `Failed to open ${brokerUrl}: ${err instanceof Error ? err.message : String(err)}`);
        tryNext(index + 1);
        return;
      }

      let settled = false;

      client.on("connect", () => {
        if (cancelled) return;
        settled = true;
        activeClient = client;
        knownGoodUrlRef.current = brokerUrl;
        onStatusRef.current?.("INFO", `Connected to MQTT (${brokerUrl})`);

        client.subscribe(config.topic, (error) => {
          if (cancelled || activeClient !== client) return;
          if (error) {
            onStatusRef.current?.("ERROR", `Subscribe failed: ${error.message}`);
            return;
          }
          setIsSubscribed(true);
          onStatusRef.current?.("INFO", `Subscribed to ${config.topic}`);
        });
      });

      client.on("message", (topic, payload) => {
        if (cancelled) return;
        onMessageRef.current?.(topic, parsePayload(payload));
      });

      client.on("error", () => { });

      client.on("close", () => {
        if (!settled && !cancelled) {
          settled = true;
          client.end(true);
          tryNext(index + 1);
          return;
        }
        if (!cancelled && settled && activeClient === client) {
          onStatusRef.current?.("INFO", `MQTT connection closed (${brokerUrl}).`);
          setIsSubscribed(false);
          activeClient = null;
        }
      });
    };

    tryNext(0);

    return () => {
      cancelled = true;
      setIsSubscribed(false);
      activeClient?.end(true);
    };
  }, [enabled, config, configLoaded, options?.wsPort, options?.wsPath]);

  return { isSubscribed };
};
