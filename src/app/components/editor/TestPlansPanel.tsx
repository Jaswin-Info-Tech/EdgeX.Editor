import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, ClipboardList, Clock3, Loader2, Search, X } from "lucide-react";

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
}: TestPlansPanelProps) {
  const RECENT_PATHS_STORAGE_KEY = "edgex.testplans.recentPaths";
  const RECENT_PATHS_LIMIT = 6;
  const filteredLabel = hasSearched && query.trim().length > 0
    ? `${testPlans.length} matching test plans`
    : `${testPlans.length} test plans`;
  const trimmedQuery = query.trim();
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

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
              <div className="truncate text-[12px] font-mono text-muted-foreground">Browse and open plans from local disk paths</div>
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
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>{filteredLabel}</span>
            <span>Tip: Press Enter to search quickly</span>
          </div>
          {recentPathChips.length > 0 && (
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
          {isLoading ? (
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
          {filteredLabel}
        </div>
      </div>
    </div>
  );
}
