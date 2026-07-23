import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  PlugZap,
  Plus,
  Server,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  getActiveServerProfile,
  getServerSettings,
  saveServerSettings,
  type ServerEnvironment,
  type ApiServerProfile,
  type ApiServerSettings,
} from "../../config/serverSettings";

interface ServerSettingsModalProps {
  isOpen: boolean;
  forceSetup?: boolean;
  onClose: () => void;
  onSaved?: (active: ApiServerProfile | null) => void;
}

function createEmptyProfile(index: number): ApiServerProfile {
  return {
    id: `server-${Date.now()}-${index}`,
    name: `Server ${index + 1}`,
    baseUrl: "",
    apiKey: "",
    licenseKey: "",
    environment: "DEV",
    lastTestedAt: undefined,
    lastLatencyMs: undefined,
    lastTestStatus: undefined,
    lastTestMessage: undefined,
  };
}

function envBadgeClass(environment: ServerEnvironment) {
  if (environment === "PROD") {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  if (environment === "UAT") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

const STALE_TEST_WINDOW_MS = 24 * 60 * 60 * 1000;

function getHealthState(profile: ApiServerProfile): "untested" | "healthy" | "error" | "stale" {
  if (!profile.lastTestedAt || !profile.lastTestStatus) return "untested";
  const testedAt = new Date(profile.lastTestedAt).getTime();
  if (!Number.isFinite(testedAt)) return "untested";
  if (Date.now() - testedAt > STALE_TEST_WINDOW_MS) return "stale";
  return profile.lastTestStatus === "success" ? "healthy" : "error";
}

function healthToneClass(state: "untested" | "healthy" | "error" | "stale") {
  if (state === "healthy") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (state === "error") return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
  if (state === "stale") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-border bg-muted/20 text-muted-foreground";
}

function healthLabel(state: "untested" | "healthy" | "error" | "stale") {
  if (state === "healthy") return "Healthy";
  if (state === "error") return "Failed";
  if (state === "stale") return "Stale";
  return "Not Tested";
}

function relativeTimeLabel(value?: string) {
  if (!value) return "Never";
  const testedAt = new Date(value).getTime();
  if (!Number.isFinite(testedAt)) return "Unknown";
  const diffMs = Date.now() - testedAt;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function resolveHealthEndpoint(baseUrl: string) {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Server base URL must start with http:// or https://");
  }
  return new URL("/api/engine/info", parsed).toString();
}

export function ServerSettingsModal({
  isOpen,
  forceSetup = false,
  onClose,
  onSaved,
}: ServerSettingsModalProps) {
  const [settings, setSettings] = useState<ApiServerSettings>({
    servers: [],
    activeServerId: null,
  });
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [autoHealthCheck, setAutoHealthCheck] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loaded = getServerSettings();
    const hasProfiles = loaded.servers.length > 0;
    const next = hasProfiles
      ? loaded
      : {
        servers: [createEmptyProfile(0)],
        activeServerId: null,
      };

    setSettings(next);
    setSelectedServerId(next.activeServerId ?? next.servers[0]?.id ?? null);
    setError("");
    setTestStatus("idle");
    setTestMessage("");
    setAutoHealthCheck(false);
    setShowApiKey(false);
    setShowLicenseKey(false);
    setCopyStatus("");
  }, [isOpen]);

  const selectedProfile = useMemo(
    () => settings.servers.find((server) => server.id === selectedServerId) ?? null,
    [settings.servers, selectedServerId],
  );

  const activeProfile = useMemo(
    () => settings.servers.find((server) => server.id === settings.activeServerId) ?? null,
    [settings.activeServerId, settings.servers],
  );

  const sortedServers = useMemo(() => {
    const priority = (state: "untested" | "healthy" | "error" | "stale") => {
      if (state === "error") return 0;
      if (state === "stale") return 1;
      if (state === "untested") return 2;
      return 3;
    };

    return [...settings.servers].sort((a, b) => {
      const healthCmp = priority(getHealthState(a)) - priority(getHealthState(b));
      if (healthCmp !== 0) return healthCmp;
      return String(a.name).localeCompare(String(b.name));
    });
  }, [settings.servers]);

  const updateSelectedProfile = (patch: Partial<ApiServerProfile>) => {
    if (!selectedServerId) return;
    setSettings((current) => ({
      ...current,
      servers: current.servers.map((server) =>
        server.id === selectedServerId ? { ...server, ...patch } : server,
      ),
    }));
  };

  const updateProfileById = (profileId: string, patch: Partial<ApiServerProfile>) => {
    setSettings((current) => ({
      ...current,
      servers: current.servers.map((server) =>
        server.id === profileId ? { ...server, ...patch } : server,
      ),
    }));
  };

  const addProfile = () => {
    const newProfile = createEmptyProfile(settings.servers.length);
    setSettings((current) => ({
      ...current,
      servers: [...current.servers, newProfile],
    }));
    setSelectedServerId(newProfile.id);
  };

  const removeSelectedProfile = () => {
    if (!selectedServerId) return;
    setSettings((current) => {
      const nextServers = current.servers.filter((server) => server.id !== selectedServerId);
      const nextSelected = nextServers[0]?.id ?? null;
      setSelectedServerId(nextSelected);
      return {
        ...current,
        servers: nextServers,
        activeServerId:
          current.activeServerId === selectedServerId
            ? nextSelected
            : current.activeServerId,
      };
    });
  };

  const exportSettings = () => {
    const payload = JSON.stringify(settings, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edgex-api-server-settings.json";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const importSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as ApiServerSettings;
        const next = saveServerSettings(parsed);
        setSettings(next);
        setSelectedServerId(next.activeServerId ?? next.servers[0]?.id ?? null);
        setError("");
      } catch {
        setError("Unable to import settings file. Please provide a valid JSON export.");
      }
    };
    input.click();
  };

  const executeConnectionTest = async (
    profile: ApiServerProfile,
    options?: { syncUi?: boolean },
  ) => {
    const syncUi = options?.syncUi !== false;
    const baseUrl = String(profile.baseUrl ?? "").trim().replace(/\/+$/, "");
    if (!baseUrl) {
      if (syncUi) {
        setTestStatus("error");
        setTestMessage("Enter a valid server base URL before testing.");
      }
      return;
    }

    let endpointUrl = "";
    try {
      endpointUrl = resolveHealthEndpoint(baseUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid server base URL. Use full URL like https://host:port";
      if (syncUi) {
        setTestStatus("error");
        setTestMessage(message);
      }
      updateProfileById(profile.id, {
        lastTestedAt: new Date().toISOString(),
        lastLatencyMs: undefined,
        lastTestStatus: "error",
        lastTestMessage: message,
      });
      return;
    }

    if (syncUi) {
      setIsTesting(true);
      setTestStatus("idle");
      setTestMessage("Testing...");
    }

    const startedAt = Date.now();

    try {
      const response = await fetch(endpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(profile.apiKey ? { "x-api-key": profile.apiKey } : {}),
          ...(profile.licenseKey ? { "x-license-key": profile.licenseKey } : {}),
          ...(profile.environment ? { "x-edgex-environment": profile.environment } : {}),
        },
      });

      const latency = Date.now() - startedAt;

      if (!response.ok) {
        if (syncUi) {
          setTestStatus("error");
          setTestMessage(`Connection failed: ${response.status} ${response.statusText}`);
        }
        updateProfileById(profile.id, {
          lastTestedAt: new Date().toISOString(),
          lastLatencyMs: latency,
          lastTestStatus: "error",
          lastTestMessage: `HTTP ${response.status} ${response.statusText}`,
        });
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!/application\/json/i.test(contentType)) {
        const message = `Invalid health response from ${endpointUrl} (expected JSON, got ${contentType || "unknown"}).`;
        if (syncUi) {
          setTestStatus("error");
          setTestMessage(message);
        }
        updateProfileById(profile.id, {
          lastTestedAt: new Date().toISOString(),
          lastLatencyMs: latency,
          lastTestStatus: "error",
          lastTestMessage: "Unexpected non-JSON response",
        });
        return;
      }

      await response.json().catch(() => null);

      if (syncUi) {
        setTestStatus("success");
        setTestMessage(`Health check successful: ${endpointUrl}`);
      }
      updateProfileById(profile.id, {
        lastTestedAt: new Date().toISOString(),
        lastLatencyMs: latency,
        lastTestStatus: "success",
        lastTestMessage: "Connection successful",
      });
    } catch {
      const latency = Date.now() - startedAt;
      if (syncUi) {
        setTestStatus("error");
        setTestMessage("Connection failed. Check URL, network, or CORS settings.");
      }
      updateProfileById(profile.id, {
        lastTestedAt: new Date().toISOString(),
        lastLatencyMs: latency,
        lastTestStatus: "error",
        lastTestMessage: "Network/CORS failure",
      });
    } finally {
      if (syncUi) {
        setIsTesting(false);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!selectedProfile) return;
    await executeConnectionTest(selectedProfile, { syncUi: true });
  };

  useEffect(() => {
    if (!isOpen || !autoHealthCheck || !activeProfile || !activeProfile.baseUrl) return;

    const interval = window.setInterval(() => {
      executeConnectionTest(activeProfile, { syncUi: false });
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeProfile, autoHealthCheck, isOpen]);

  const handleSave = () => {
    if (settings.servers.length === 0) {
      setError("Add at least one API server.");
      return;
    }

    const normalizedServers = settings.servers.map((server, index) => ({
      ...server,
      name: String(server.name ?? "").trim() || `Server ${index + 1}`,
      baseUrl: String(server.baseUrl ?? "").trim().replace(/\/+$/, ""),
      apiKey: String(server.apiKey ?? "").trim(),
      licenseKey: String(server.licenseKey ?? "").trim(),
      environment: (String(server.environment ?? "DEV").toUpperCase() as ServerEnvironment),
    }));

    const hasInvalidBaseUrl = normalizedServers.some((server) => !server.baseUrl);
    if (hasInvalidBaseUrl) {
      setError("Server base URL is required for all saved profiles.");
      return;
    }

    const activeServerId = selectedServerId ?? normalizedServers[0].id;
    const next = saveServerSettings({
      servers: normalizedServers,
      activeServerId,
    });

    setSettings(next);
    setSelectedServerId(next.activeServerId);
    setError("");
    onSaved?.(getActiveServerProfile(next));
    onClose();
  };

  const handleCopyBaseUrl = async () => {
    if (!selectedProfile?.baseUrl) return;
    try {
      await navigator.clipboard.writeText(selectedProfile.baseUrl);
      setCopyStatus("Base URL copied");
    } catch {
      setCopyStatus("Unable to copy URL");
    }
    setTimeout(() => setCopyStatus(""), 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60"
    >
      <div
        className="flex h-[620px] max-h-[92vh] w-[900px] max-w-[96vw] flex-col overflow-hidden border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
              <Server size={15} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-foreground">
                {forceSetup ? "Initial Setup - API Server" : "API Server Settings"}
              </div>
              <div className="truncate text-[11px] font-mono text-muted-foreground">
                Configure base URL, API key, and license key for backend connections.
              </div>
            </div>
          </div>
          {!forceSetup && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="min-h-0 flex flex-1 overflow-hidden">
          <aside className="flex w-[270px] shrink-0 flex-col border-r border-border bg-muted/10">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                Servers
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={importSettings}
                  className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Import settings"
                >
                  <Upload size={11} />
                </button>
                <button
                  onClick={exportSettings}
                  className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title="Export settings"
                >
                  <Download size={11} />
                </button>
                <button
                  onClick={addProfile}
                  className="flex h-7 items-center gap-1 border border-border px-2 text-[10px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {settings.servers.length === 0 ? (
                <div className="px-2 py-4 text-[11px] font-mono text-muted-foreground">
                  No server profiles.
                </div>
              ) : (
                sortedServers.map((server) => {
                  const isSelected = server.id === selectedServerId;
                  const isActive = server.id === settings.activeServerId;
                  const healthState = getHealthState(server);
                  return (
                    <button
                      key={server.id}
                      onClick={() => setSelectedServerId(server.id)}
                      className={`mb-1.5 flex w-full items-start gap-2 border px-2.5 py-2 text-left transition-colors ${isSelected
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/70 hover:bg-secondary/40"
                        }`}
                    >
                      <Server size={12} className="mt-0.5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-semibold text-foreground">
                          {server.name || "Unnamed server"}
                        </div>
                        <div className="truncate text-[10px] font-mono text-muted-foreground">
                          {server.baseUrl || "Base URL not set"}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex border px-1.5 py-0 text-[10px] font-mono font-semibold ${envBadgeClass(server.environment)}`}>
                            {server.environment}
                          </span>
                          <span className={`inline-flex items-center gap-1 border px-1.5 py-0 text-[10px] font-mono font-semibold ${healthToneClass(healthState)}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {healthLabel(healthState)}
                          </span>
                        </div>
                        <div className="mt-1 truncate text-[10px] font-mono text-muted-foreground">
                          Tested {relativeTimeLabel(server.lastTestedAt)}
                          {typeof server.lastLatencyMs === "number" ? ` - ${server.lastLatencyMs}ms` : ""}
                        </div>
                      </div>
                      {isActive && <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="min-h-0 flex-1 overflow-y-auto p-4">
            {selectedProfile ? (
              <div className="space-y-3">
                {(() => {
                  const state = getHealthState(selectedProfile);
                  return (
                    <div className="border border-border bg-muted/10 px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] font-mono text-muted-foreground">Connection Health</div>
                        <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-mono font-semibold ${healthToneClass(state)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {healthLabel(state)}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] font-mono text-muted-foreground sm:grid-cols-3">
                        <div className="flex items-center gap-1">
                          <Clock3 size={11} /> {relativeTimeLabel(selectedProfile.lastTestedAt)}
                        </div>
                        <div>
                          Latency: {typeof selectedProfile.lastLatencyMs === "number" ? `${selectedProfile.lastLatencyMs} ms` : "-"}
                        </div>
                        <div className="truncate">
                          {selectedProfile.lastTestMessage || "No test result yet"}
                        </div>
                      </div>
                      {state === "stale" && (
                        <div className="mt-2 inline-flex items-center gap-1 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                          <AlertTriangle size={11} />
                          Health check is older than 24h. Re-test recommended.
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div>
                  <label className="mb-1 block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Server Name
                  </label>
                  <input
                    value={selectedProfile.name}
                    onChange={(event) => updateSelectedProfile({ name: event.target.value })}
                    placeholder="Production API"
                    className="h-9 w-full border border-border bg-background px-2.5 text-[12px] font-mono text-foreground outline-none transition-colors focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Environment
                  </label>
                  <div className="flex items-center gap-2">
                    {(["DEV", "UAT", "PROD"] as ServerEnvironment[]).map((env) => (
                      <button
                        key={env}
                        onClick={() => updateSelectedProfile({ environment: env })}
                        className={`h-8 border px-3 text-[11px] font-mono font-semibold transition-colors ${selectedProfile.environment === env
                          ? `${envBadgeClass(env)} border`
                          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Server Base URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      value={selectedProfile.baseUrl}
                      onChange={(event) => updateSelectedProfile({ baseUrl: event.target.value })}
                      placeholder="https://api.company.com"
                      className="h-9 w-full border border-border bg-background px-2.5 text-[12px] font-mono text-foreground outline-none transition-colors focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBaseUrl}
                      className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Copy base URL"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {copyStatus && (
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground">{copyStatus}</div>
                  )}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    <KeyRound size={11} /> API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={selectedProfile.apiKey}
                      onChange={(event) => updateSelectedProfile({ apiKey: event.target.value })}
                      placeholder="Optional API key"
                      className="h-9 w-full border border-border bg-background px-2.5 text-[12px] font-mono text-foreground outline-none transition-colors focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((value) => !value)}
                      className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck size={11} /> License Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showLicenseKey ? "text" : "password"}
                      value={selectedProfile.licenseKey}
                      onChange={(event) => updateSelectedProfile({ licenseKey: event.target.value })}
                      placeholder="Optional license key"
                      className="h-9 w-full border border-border bg-background px-2.5 text-[12px] font-mono text-foreground outline-none transition-colors focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLicenseKey((value) => !value)}
                      className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title={showLicenseKey ? "Hide license key" : "Show license key"}
                    >
                      {showLicenseKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

                <div className="border border-border bg-muted/10 px-3 py-2 text-[10px] font-mono text-muted-foreground">
                  Default header preset for this environment: <span className="text-foreground">x-edgex-environment: {selectedProfile.environment}</span>
                </div>

                <label className="flex items-center gap-2 border border-border bg-muted/10 px-3 py-2 text-[11px] font-mono text-foreground">
                  <input
                    type="checkbox"
                    checked={settings.activeServerId === selectedProfile.id}
                    onChange={(event) => {
                      if (!event.target.checked) return;
                      setSettings((current) => ({
                        ...current,
                        activeServerId: selectedProfile.id,
                      }));
                    }}
                  />
                  Use this profile as active backend server
                </label>


                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="flex h-8 shrink-0 items-center gap-2 border border-primary/30 bg-primary/10 px-3 text-[11px] font-mono font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <PlugZap size={12} />
                      {isTesting ? "Testing..." : "Test Connection"}
                    </button>
                  </div>

                  {testStatus !== "idle" && (
                    <div
                      className={`flex items-start gap-1.5 border px-2.5 py-1.5 text-[11px] font-mono break-all ${testStatus === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                    >
                      {testStatus === "success" ? (
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      )}
                      <span>{testMessage}</span>
                    </div>
                  )}
                </div>

                {activeProfile && (
                  <label className="flex items-center gap-2 border border-border bg-muted/10 px-3 py-2 text-[11px] font-mono text-foreground">
                    <input
                      type="checkbox"
                      checked={autoHealthCheck}
                      onChange={(event) => setAutoHealthCheck(event.target.checked)}
                    />
                    Auto-check active server every 60s ({activeProfile.name})
                  </label>
                )}

                {settings.servers.length > 1 && (
                  <div>
                    <button
                      onClick={removeSelectedProfile}
                      className="flex h-8 items-center gap-2 border border-destructive/30 px-3 text-[11px] font-mono font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 size={12} /> Delete Profile
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-border px-3 py-4 text-[11px] font-mono text-muted-foreground">
                Select or add a server profile.
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2.5">
          <div className="text-[11px] font-mono text-muted-foreground">
            Active: {getActiveServerProfile(settings)?.name ?? "Not configured"}
          </div>
          <div className="flex items-center gap-2">
            {!forceSetup && (
              <button
                onClick={onClose}
                className="h-8 border border-border px-3 text-[12px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex h-8 items-center gap-2 bg-primary px-3 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CheckCircle2 size={12} /> Save Settings
            </button>
          </div>
        </div>

        {error && (
          <div className="border-t border-destructive/30 bg-destructive/10 px-4 py-2 text-[11px] font-mono text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
