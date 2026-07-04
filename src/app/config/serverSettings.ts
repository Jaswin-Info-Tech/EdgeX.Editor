import { env } from "./env";

export const SERVER_SETTINGS_STORAGE_KEY = "edgex.api.serverSettings.v1";

export type ServerEnvironment = "DEV" | "UAT" | "PROD";

export interface ApiServerProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  licenseKey: string;
  environment: ServerEnvironment;
  lastTestedAt?: string;
  lastLatencyMs?: number;
  lastTestStatus?: "success" | "error";
  lastTestMessage?: string;
}

export interface ApiServerSettings {
  servers: ApiServerProfile[];
  activeServerId: string | null;
}

function normalizeBaseUrl(value: string) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function sanitizeProfile(profile: Partial<ApiServerProfile>, index: number): ApiServerProfile | null {
  const baseUrl = normalizeBaseUrl(profile.baseUrl ?? "");
  if (!baseUrl) return null;
  const rawEnv = String(profile.environment ?? "DEV").toUpperCase();
  const environment: ServerEnvironment =
    rawEnv === "UAT" ? "UAT" : rawEnv === "PROD" ? "PROD" : "DEV";

  return {
    id: String(profile.id ?? `server-${index + 1}`),
    name: String(profile.name ?? `Server ${index + 1}`).trim() || `Server ${index + 1}`,
    baseUrl,
    apiKey: String(profile.apiKey ?? "").trim(),
    licenseKey: String(profile.licenseKey ?? "").trim(),
    environment,
    lastTestedAt: profile.lastTestedAt ? String(profile.lastTestedAt) : undefined,
    lastLatencyMs:
      typeof profile.lastLatencyMs === "number" && Number.isFinite(profile.lastLatencyMs)
        ? profile.lastLatencyMs
        : undefined,
    lastTestStatus:
      profile.lastTestStatus === "success" || profile.lastTestStatus === "error"
        ? profile.lastTestStatus
        : undefined,
    lastTestMessage: profile.lastTestMessage ? String(profile.lastTestMessage) : undefined,
  };
}

function fallbackFromEnv(): ApiServerSettings {
  const envBaseUrl = normalizeBaseUrl(env.API_URL ?? "");
  if (!envBaseUrl) {
    return { servers: [], activeServerId: null };
  }

  const envProfile: ApiServerProfile = {
    id: "env-default",
    name: "Default Server",
    baseUrl: envBaseUrl,
    apiKey: "",
    licenseKey: "",
    environment: "DEV",
    lastTestedAt: undefined,
    lastLatencyMs: undefined,
    lastTestStatus: undefined,
    lastTestMessage: undefined,
  };

  return {
    servers: [envProfile],
    activeServerId: envProfile.id,
  };
}

function sanitizeSettings(raw: Partial<ApiServerSettings> | null | undefined): ApiServerSettings {
  const normalized = Array.isArray(raw?.servers)
    ? raw!.servers
        .map((profile, index) => sanitizeProfile(profile, index))
        .filter((profile): profile is ApiServerProfile => Boolean(profile))
    : [];

  const envFallback = fallbackFromEnv();
  const merged = normalized.length > 0 ? normalized : envFallback.servers;

  const hasRequestedActive = merged.some((profile) => profile.id === raw?.activeServerId);
  const activeServerId = hasRequestedActive
    ? String(raw?.activeServerId)
    : merged.length > 0
      ? merged[0].id
      : null;

  return {
    servers: merged,
    activeServerId,
  };
}

export function getServerSettings(): ApiServerSettings {
  if (typeof window === "undefined") {
    return sanitizeSettings(null);
  }

  try {
    const raw = window.localStorage.getItem(SERVER_SETTINGS_STORAGE_KEY);
    if (!raw) return sanitizeSettings(null);
    const parsed = JSON.parse(raw) as Partial<ApiServerSettings>;
    return sanitizeSettings(parsed);
  } catch {
    return sanitizeSettings(null);
  }
}

export function saveServerSettings(settings: ApiServerSettings) {
  const normalized = sanitizeSettings(settings);
  if (typeof window === "undefined") return normalized;

  try {
    window.localStorage.setItem(SERVER_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage write errors.
  }

  return normalized;
}

export function getActiveServerProfile(settings?: ApiServerSettings): ApiServerProfile | null {
  const source = settings ?? getServerSettings();
  if (!source.activeServerId) return source.servers[0] ?? null;
  return source.servers.find((profile) => profile.id === source.activeServerId) ?? source.servers[0] ?? null;
}

export function hasConfiguredServer(settings?: ApiServerSettings) {
  const active = getActiveServerProfile(settings);
  return Boolean(active?.baseUrl);
}
