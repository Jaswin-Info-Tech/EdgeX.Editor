import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardList, Clock3, Info, Loader2, Search, Server, Upload, X } from "lucide-react";

interface TestPlansPanelProps {
  testPlans: any[];
  query: string;
  setQuery: (value: string) => void;
  hasSearched: boolean;
  isLoading: boolean;
  isError: boolean;
  openingPath: string | null;
  openError: string;
  showUnsavedWarning: boolean;
  pendingTestPlan: any | null;
  onSearch: () => void;
  onOpen: (testPlan: any) => void;
  onClose: () => void;
  onCancelUnsavedWarning: () => void;
  onSaveUnsavedChanges: () => Promise<void>;
  onUploadTapPlan: (file: File, destinationPath?: string) => Promise<void>;
  onImportRemotePlan: (payload: {
    sourceType: "ftp" | "sftp" | "rest";
    sourceUrl: string;
    destinationPath?: string;
    username?: string;
    password?: string;
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
  }) => Promise<void>;
}

export function TestPlansPanel({
  testPlans,
  query,
  setQuery,
  hasSearched,
  isLoading,
  isError,
  openingPath,
  openError,
  showUnsavedWarning,
  pendingTestPlan,
  onSearch,
  onOpen,
  onClose,
  onCancelUnsavedWarning,
  onSaveUnsavedChanges,
  onUploadTapPlan,
  onImportRemotePlan,
}: TestPlansPanelProps) {
  type SourceMode = "browse" | "upload" | "remote";
  type FieldErrorKey = "uploadFile" | "remoteUrl" | "remoteHeaders";
  const SOURCE_MODE_META: Record<SourceMode, { title: string; description: string; tip: string }> = {
    browse: {
      title: "Browse Local Path",
      description: "Find and open plans already available on your API server disk paths.",
      tip: "Press Enter in the path box to search quickly.",
    },
    upload: {
      title: "Upload .TapPlan",
      description: "Send a local .TapPlan file directly to the API server.",
      tip: "Use destination path to save into a specific server folder.",
    },
    remote: {
      title: "Pull from FTP/REST/SFTP",
      description: "Let your API server fetch plans from remote sources and store them.",
      tip: "Validate source URL and headers before pulling.",
    },
  };
  const RECENT_PATHS_STORAGE_KEY = "edgex.testplans.recentPaths";
  const RECENT_PATHS_LIMIT = 6;
  const filteredLabel = hasSearched && query.trim().length > 0
    ? `${testPlans.length} matching test plans`
    : `${testPlans.length} test plans`;
  const trimmedQuery = query.trim();
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [sourceMode, setSourceMode] = useState<SourceMode>("browse");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDestination, setUploadDestination] = useState("");
  const [remoteSourceType, setRemoteSourceType] = useState<"ftp" | "sftp" | "rest">("rest");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteDestination, setRemoteDestination] = useState("");
  const [remoteUsername, setRemoteUsername] = useState("");
  const [remotePassword, setRemotePassword] = useState("");
  const [remoteMethod, setRemoteMethod] = useState<"GET" | "POST">("GET");
  const [remoteHeadersText, setRemoteHeadersText] = useState('{\n  "Authorization": "Bearer <token>"\n}');
  const [remoteBody, setRemoteBody] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");
  const [transferDensity, setTransferDensity] = useState<"comfortable" | "compact">("comfortable");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const activeModeMeta = SOURCE_MODE_META[sourceMode];
  const isCompact = transferDensity === "compact";
  const fieldHeightClass = isCompact ? "h-7" : "h-8";
  const fieldTextClass = isCompact ? "text-[11px]" : "text-[12px]";
  const formGapClass = isCompact ? "space-y-2" : "space-y-3";
  const helpTextClass = isCompact ? "text-[10px]" : "text-[11px]";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_PATHS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .slice(0, RECENT_PATHS_LIMIT);
      setRecentPaths(normalized);
    } catch {
      // Ignore local storage parse issues and continue with empty recent paths.
    }
  }, []);

  const persistRecentPaths = (next: string[]) => {
    setRecentPaths(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(RECENT_PATHS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write failures.
    }
  };

  const rememberPath = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    const next = [
      normalized,
      ...recentPaths.filter((entry) => entry.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, RECENT_PATHS_LIMIT);
    persistRecentPaths(next);
  };

  const recentPathChips = useMemo(
    () => recentPaths.filter((entry) => entry && entry.trim().length > 0),
    [recentPaths],
  );

  const handleSearch = () => {
    rememberPath(query);
    onSearch();
  };

  const resetTransferBanner = () => {
    setTransferError("");
    setTransferSuccess("");
  };

  const clearFieldError = (field: FieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleUploadSubmit = async () => {
    resetTransferBanner();
    setFieldErrors({});
    if (!uploadFile) {
      setFieldErrors({ uploadFile: "Select a .TapPlan file before uploading." });
      setTransferError("Select a .TapPlan file before uploading.");
      return;
    }

    if (!/\.tapplan$/i.test(uploadFile.name)) {
      setFieldErrors({ uploadFile: "Only .TapPlan files are supported." });
      setTransferError("Only .TapPlan files are supported.");
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await onUploadTapPlan(uploadFile, uploadDestination.trim() || undefined);
      setTransferSuccess(`Uploaded ${uploadFile.name} to API server.`);
      if (uploadDestination.trim()) {
        setQuery(uploadDestination.trim());
      }
      setSourceMode("browse");
      setUploadFile(null);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleRemoteSubmit = async () => {
    resetTransferBanner();
    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};
    const trimmedUrl = remoteUrl.trim();
    if (!trimmedUrl) {
      nextFieldErrors.remoteUrl = "Enter FTP, SFTP, or REST source URL.";
      setFieldErrors(nextFieldErrors);
      setTransferError("Enter FTP, SFTP, or REST source URL.");
      return;
    }

    if (remoteSourceType === "ftp" && !/^ftps?:\/\//i.test(trimmedUrl)) {
      nextFieldErrors.remoteUrl = "FTP source URL must start with ftp:// or ftps://";
      setFieldErrors(nextFieldErrors);
      setTransferError(nextFieldErrors.remoteUrl);
      return;
    }

    if (remoteSourceType === "sftp" && !/^sftp:\/\//i.test(trimmedUrl)) {
      nextFieldErrors.remoteUrl = "SFTP source URL must start with sftp://";
      setFieldErrors(nextFieldErrors);
      setTransferError(nextFieldErrors.remoteUrl);
      return;
    }

    if (remoteSourceType === "rest" && !/^https?:\/\//i.test(trimmedUrl)) {
      nextFieldErrors.remoteUrl = "REST source URL must start with http:// or https://";
      setFieldErrors(nextFieldErrors);
      setTransferError(nextFieldErrors.remoteUrl);
      return;
    }

    let parsedHeaders: Record<string, string> | undefined;
    if (remoteSourceType === "rest" && remoteHeadersText.trim()) {
      try {
        const parsed = JSON.parse(remoteHeadersText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Headers must be a JSON object.");
        }

        parsedHeaders = Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
          acc[String(key)] = String(value ?? "");
          return acc;
        }, {});
      } catch (error) {
        nextFieldErrors.remoteHeaders = error instanceof Error ? error.message : "Invalid JSON headers.";
        setFieldErrors(nextFieldErrors);
        setTransferError(error instanceof Error ? error.message : "Invalid JSON headers.");
        return;
      }
    }

    setFieldErrors({});

    setIsSubmittingTransfer(true);
    try {
      await onImportRemotePlan({
        sourceType: remoteSourceType,
        sourceUrl: trimmedUrl,
        destinationPath: remoteDestination.trim() || undefined,
        username: remoteSourceType === "ftp" || remoteSourceType === "sftp" ? (remoteUsername.trim() || undefined) : undefined,
        password: remoteSourceType === "ftp" || remoteSourceType === "sftp" ? (remotePassword || undefined) : undefined,
        method: remoteSourceType === "rest" ? remoteMethod : undefined,
        headers: remoteSourceType === "rest" ? parsedHeaders : undefined,
        body: remoteSourceType === "rest" && remoteMethod === "POST" ? (remoteBody.trim() || undefined) : undefined,
      });

      setTransferSuccess("Remote pull request submitted to API server.");
      if (remoteDestination.trim()) {
        setQuery(remoteDestination.trim());
      }
      setSourceMode("browse");
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "Remote import failed.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const applyRecentPath = (value: string) => {
    setQuery(value);
    rememberPath(value);
    onSearch();
  };

  const clearRecentPaths = () => {
    persistRecentPaths([]);
  };

  const formatTimestamp = (value: unknown) => {
    if (!value) return "-";
    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div className="flex h-[640px] max-h-[90vh] w-[980px] max-w-[96vw] flex-col overflow-hidden border border-border/80 bg-card shadow-[0_28px_64px_rgba(0,0,0,0.45)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-gradient-to-r from-muted/70 via-muted/30 to-card">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-primary/35 bg-primary/10 text-primary shadow-sm">
              <ClipboardList size={14} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-foreground">Test Plans</div>
              <div className="truncate text-[12px] font-mono text-muted-foreground">{activeModeMeta.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-7 items-center border border-border bg-background/80 px-2.5 text-[11px] font-mono text-muted-foreground md:flex">
              {filteredLabel}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-border bg-muted/20 px-4 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="rounded-md border border-border bg-background/80 p-1">
              <div className="flex flex-wrap gap-1.5">
            {([
              ["browse", "Browse Local Path"],
              ["upload", "Upload .TapPlan"],
              ["remote", "Pull from FTP/REST/SFTP"],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => {
                  resetTransferBanner();
                  setSourceMode(mode);
                }}
                className={`h-8 border px-2.5 text-[11px] font-mono transition-colors ${
                  sourceMode === mode
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
              </div>
            </div>
            {sourceMode !== "browse" && (
              <button
                onClick={() => setTransferDensity((prev) => (prev === "comfortable" ? "compact" : "comfortable"))}
                className="h-8 border border-border bg-background px-2.5 text-[11px] font-mono text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                title="Toggle compact transfer form"
              >
                {isCompact ? "Comfortable" : "Compact"}
              </button>
            )}
            </div>

          {sourceMode === "browse" && (
          <div className="flex w-full items-center gap-2">
            <div className="flex h-[38px] flex-1 items-center gap-2 border border-border bg-background px-3 focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
              <Search size={13} className="shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Search path or plan name (example: D:\\plans)"
                className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground/90 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="flex h-[38px] shrink-0 items-center gap-2 bg-primary px-4 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Search size={12} /> Search
            </button>
          </div>
          )}
          <div className="mt-2 grid gap-2 border border-border bg-background/70 px-3 py-2 text-[11px] font-mono md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <div className="truncate text-foreground">{activeModeMeta.title}</div>
              <div className="truncate text-muted-foreground">{activeModeMeta.tip}</div>
            </div>
            <span>
              {sourceMode === "browse" ? filteredLabel : "Transfer test plans into API server"}
            </span>
          </div>
          {sourceMode === "browse" && recentPathChips.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0">
                  <Clock3 size={11} /> Recent:
                </div>
                <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1">
                  {recentPathChips.map((path) => (
                    <button
                      key={path}
                      onClick={() => applyRecentPath(path)}
                      className="h-6 shrink-0 border border-border bg-background px-2 text-[11px] font-mono text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      title={`Search ${path}`}
                    >
                      {path}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={clearRecentPaths}
                className="h-6 shrink-0 border border-border px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title="Clear recent paths"
              >
                Clear
              </button>
            </div>
          )}

          {(transferError || transferSuccess) && sourceMode !== "browse" && (
            <div
              className={`mt-2 border px-3 py-2 text-[11px] font-mono ${
                transferError
                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {transferError ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                <span>{transferError || transferSuccess}</span>
              </div>
            </div>
          )}
        </div>

        {showUnsavedWarning && (
          <div className="mx-4 mt-2 border border-yellow-500/35 bg-yellow-500/10 shadow-sm">
            <div className="flex items-start gap-3 px-3 py-2">
              <AlertTriangle
                size={16}
                className="text-yellow-500 shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-foreground">
                  Save changes before loading another test plan
                </div>
                <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                  Your current test plan has unsaved sequence or property
                  changes. Click Save before opening
                  {pendingTestPlan?.name
                    ? ` "${pendingTestPlan.name}"`
                    : " another test plan"}
                  .
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onCancelUnsavedWarning}
                  className="h-8 px-3 border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSaveUnsavedChanges}
                  className="h-8 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-card">
          {openError && (
            <div className="border-b border-border px-5 py-3 text-[12px] font-mono text-destructive">
              {openError}
            </div>
          )}

          {sourceMode === "upload" ? (
            <div className="px-4 py-4">
              <div className="mx-auto max-w-[860px] border border-border bg-muted/15">
                <div className="border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <Upload size={14} className="text-primary" /> Manual .TapPlan Upload
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Upload a local .TapPlan file and store it on your API server.
                  </div>
                </div>
                <div className={`${formGapClass} px-4 py-3`}>
                  <div>
                    <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>TapPlan File</div>
                    <input
                      type="file"
                      accept=".tapplan"
                      onChange={(e) => {
                        setUploadFile(e.target.files?.[0] ?? null);
                        clearFieldError("uploadFile");
                      }}
                      className={`w-full border bg-background px-2 py-1.5 ${fieldTextClass} text-foreground file:mr-2 file:border-0 file:bg-primary file:px-2 file:py-1 file:text-[11px] file:font-mono file:font-semibold file:text-primary-foreground ${fieldErrors.uploadFile ? "border-red-500/60" : "border-border"}`}
                    />
                    <div className={`mt-1 ${helpTextClass} font-mono ${fieldErrors.uploadFile ? "text-red-400" : "text-muted-foreground"}`}>
                      {fieldErrors.uploadFile || (uploadFile ? `Selected: ${uploadFile.name}` : "Only .tapplan files are accepted.")}
                    </div>
                  </div>
                  <div>
                    <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Destination Path (optional)</div>
                    <input
                      type="text"
                      value={uploadDestination}
                      onChange={(e) => setUploadDestination(e.target.value)}
                      placeholder="D:\\plans"
                      className={`${fieldHeightClass} w-full border border-border bg-background px-2 ${fieldTextClass} font-mono text-foreground`}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadDestination("");
                        resetTransferBanner();
                      }}
                      className="h-8 border border-border px-3 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={isSubmittingTransfer}
                      className="flex h-8 items-center gap-2 bg-primary px-3 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmittingTransfer ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload to API Server
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : sourceMode === "remote" ? (
            <div className="px-4 py-4">
              <div className="mx-auto max-w-[860px] border border-border bg-muted/15">
                <div className="border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <Server size={14} className="text-primary" /> Pull from FTP, SFTP, or REST API
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Ask your API server to fetch remote plans, then save them locally for browsing.
                  </div>
                </div>
                <div className={`${formGapClass} px-4 py-3`}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Source Type</div>
                      <select
                        value={remoteSourceType}
                        onChange={(e) => {
                          setRemoteSourceType((e.target.value as "ftp" | "sftp" | "rest"));
                          clearFieldError("remoteUrl");
                          clearFieldError("remoteHeaders");
                        }}
                        className={`${fieldHeightClass} w-full border border-border bg-background px-2 ${fieldTextClass} font-mono text-foreground`}
                      >
                        <option value="rest">REST API</option>
                        <option value="ftp">FTP / FTPS</option>
                        <option value="sftp">SFTP</option>
                      </select>
                    </div>
                    <div>
                      <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Destination Path (optional)</div>
                      <input
                        type="text"
                        value={remoteDestination}
                        onChange={(e) => setRemoteDestination(e.target.value)}
                        placeholder="D:\\plans"
                        className={`${fieldHeightClass} w-full border border-border bg-background px-2 ${fieldTextClass} font-mono text-foreground`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Source URL</div>
                    <input
                      type="text"
                      value={remoteUrl}
                      onChange={(e) => {
                        setRemoteUrl(e.target.value);
                        clearFieldError("remoteUrl");
                      }}
                      placeholder={remoteSourceType === "ftp" ? "ftp://host/path/plan.tapplan" : remoteSourceType === "sftp" ? "sftp://host/path/plan.tapplan" : "https://server/api/testplans"}
                      className={`${fieldHeightClass} w-full border bg-background px-2 ${fieldTextClass} font-mono text-foreground ${fieldErrors.remoteUrl ? "border-red-500/60" : "border-border"}`}
                    />
                    <div className={`mt-1 ${helpTextClass} font-mono ${fieldErrors.remoteUrl ? "text-red-400" : "text-muted-foreground"}`}>
                      {fieldErrors.remoteUrl || (remoteSourceType === "ftp"
                        ? "Example: ftp://host/path/TestPlan.tapplan"
                        : remoteSourceType === "sftp"
                          ? "Example: sftp://host/path/TestPlan.tapplan"
                        : "Example: https://server/api/testplans/export")}
                    </div>
                  </div>

                  {remoteSourceType === "ftp" || remoteSourceType === "sftp" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[11px] font-mono text-muted-foreground">Username (optional)</div>
                        <input
                          type="text"
                          value={remoteUsername}
                          onChange={(e) => setRemoteUsername(e.target.value)}
                          className="h-8 w-full border border-border bg-background px-2 text-[12px] font-mono text-foreground"
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[11px] font-mono text-muted-foreground">Password (optional)</div>
                        <input
                          type="password"
                          value={remotePassword}
                          onChange={(e) => setRemotePassword(e.target.value)}
                          className="h-8 w-full border border-border bg-background px-2 text-[12px] font-mono text-foreground"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>HTTP Method</div>
                          <select
                            value={remoteMethod}
                            onChange={(e) => setRemoteMethod((e.target.value as "GET" | "POST"))}
                            className={`${fieldHeightClass} w-full border border-border bg-background px-2 ${fieldTextClass} font-mono text-foreground`}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                          </select>
                        </div>
                        <div>
                          <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Headers (JSON)</div>
                          <textarea
                            value={remoteHeadersText}
                            onChange={(e) => {
                              setRemoteHeadersText(e.target.value);
                              clearFieldError("remoteHeaders");
                            }}
                            rows={isCompact ? 3 : 4}
                            className={`w-full border bg-background px-2 py-1.5 text-[11px] font-mono text-foreground ${fieldErrors.remoteHeaders ? "border-red-500/60" : "border-border"}`}
                          />
                          <div className={`mt-1 text-[10px] font-mono ${fieldErrors.remoteHeaders ? "text-red-400" : "text-muted-foreground"}`}>
                            {fieldErrors.remoteHeaders || "JSON object format"}
                          </div>
                        </div>
                      </div>
                      {remoteMethod === "POST" && (
                        <div>
                          <div className={`${helpTextClass} mb-1 font-mono text-muted-foreground`}>Request Body (optional JSON/text)</div>
                          <textarea
                            value={remoteBody}
                            onChange={(e) => setRemoteBody(e.target.value)}
                            rows={isCompact ? 4 : 5}
                            className="w-full border border-border bg-background px-2 py-1.5 text-[11px] font-mono text-foreground"
                          />
                          <div className="mt-1 text-[10px] font-mono text-muted-foreground">Plain text or JSON payload</div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-start gap-2 border border-border bg-background/80 px-3 py-2 text-[11px] text-muted-foreground">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    <span>
                      After successful pull, switch to Browse Local Path and search destination path to open the plan.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setRemoteUrl("");
                        setRemoteDestination("");
                        setRemoteUsername("");
                        setRemotePassword("");
                        setRemoteMethod("GET");
                        setRemoteBody("");
                        resetTransferBanner();
                      }}
                      className="h-8 border border-border px-3 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleRemoteSubmit}
                      disabled={isSubmittingTransfer}
                      className="flex h-8 items-center gap-2 bg-primary px-3 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmittingTransfer ? <Loader2 size={12} className="animate-spin" /> : <Server size={12} />} Pull and Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              Searching test plans on disk...
            </div>
          ) : isError ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
              Unable to load test plans.
            </div>
          ) : !hasSearched ? (
            <div className="px-4 py-4">
              <div className="mx-auto max-w-[860px] border border-border bg-muted/15">
                <div className="border-b border-border px-4 py-2.5">
                  <div className="text-[13px] font-semibold text-foreground">Load Test Plans</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Enter a folder path and run search.
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="grid gap-2 text-[11px] text-muted-foreground md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0 truncate">
                      Steps: 1) Type path (example: <span className="font-mono">D:\\plans</span>) 2) Press Enter/Search 3) Open a plan row.
                    </div>
                    <button
                      onClick={handleSearch}
                      className="flex h-8 items-center justify-center gap-2 bg-primary px-3 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Search size={12} /> Search Now
                    </button>
                  </div>

                  {recentPathChips.length > 0 && (
                    <div className="mt-3 border border-border bg-background px-3 py-2.5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                          <Clock3 size={12} /> Recent Paths
                        </div>
                        <button
                          onClick={clearRecentPaths}
                          className="h-6 border border-border px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentPathChips.map((path) => (
                          <button
                            key={`guide:${path}`}
                            onClick={() => applyRecentPath(path)}
                            className="h-6 border border-border bg-background px-2 text-[11px] font-mono text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                            title={`Search ${path}`}
                          >
                            {path}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 border border-dashed border-border bg-background/70 px-3 py-2 text-[11px] text-muted-foreground">
                    {trimmedQuery ? `Ready to search in: ${trimmedQuery}` : "Enter a path above to begin."}
                  </div>
                </div>
              </div>
            </div>
          ) : hasSearched && testPlans.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              No test plans found for your search.
            </div>
          ) : (
            <>
              <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_88px_180px_26px] items-center gap-2 border-b border-border bg-muted/45 px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                <span>Name / Path</span>
                <span className="text-right">Steps</span>
                <span>Last Modified</span>
                <span />
              </div>
              {testPlans.map((plan: any, index: number) => {
                const isOpening = openingPath === plan.path;
                return (
                  <button
                    key={`${plan.path}:${index}`}
                    onClick={() => onOpen(plan)}
                    disabled={!!openingPath}
                    title={String(plan.path ?? "").replace(/\\/g, "\\\\")}
                    className="group relative grid w-full grid-cols-[minmax(0,1fr)_88px_180px_26px] items-center gap-2 border-b border-border border-l-2 border-l-transparent px-4 py-2 text-left transition-colors hover:border-l-primary/60 hover:bg-secondary/40 focus:bg-primary/10 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
                        {plan.name}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground transition-colors group-hover:text-foreground/75">
                        {String(plan.path ?? "").replace(/\\/g, "\\\\")}
                      </div>
                    </div>

                    <span className="justify-self-end whitespace-nowrap border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {plan.stepCount} steps
                    </span>

                    <span className="whitespace-nowrap border border-border bg-background px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {formatTimestamp(plan.lastModified)}
                    </span>

                    <ChevronRight size={14} className="shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />

                    {isOpening && (
                      <div className="absolute inset-0 flex items-center justify-center bg-card/85 backdrop-blur-[1px]">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        <span className="ml-2 text-[12px] font-mono text-primary">
                          Opening...
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="border-t border-border bg-muted/25 px-4 py-2 text-[11px] font-mono text-muted-foreground">
          {sourceMode === "browse" ? filteredLabel : "Test plan transfer options"}
        </div>
      </div>
    </div>
  );
}
