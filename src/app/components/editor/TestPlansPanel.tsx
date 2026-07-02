import { AlertTriangle, ChevronRight, Loader2, Search, X } from "lucide-react";

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
  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-[760px] max-w-[92vw] h-[540px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">
              Test Plans
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="flex w-full items-center gap-2">
            <div className="flex flex-1 items-center gap-2 border border-border px-2.5 py-2 bg-background">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSearch();
                }}
                placeholder="Search test plans..."
                className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <button
              onClick={onSearch}
              className="flex h-[34px] items-center gap-2 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors shrink-0"
            >
              <Search size={12} /> Search
            </button>
          </div>
        </div>
        {showUnsavedWarning && (
          <div className="mx-4 mt-2 border border-yellow-500/30 bg-yellow-500/10 shadow-sm">
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
        <div className="flex-1 overflow-y-auto">
          {openError && (
            <div className="px-5 py-3 border-b border-border text-[12px] font-mono text-destructive">
              {openError}
            </div>
          )}
          {isLoading ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              Searching Test Plans..
            </div>
          ) : isError ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
              Unable to load test plans.
            </div>
          ) : hasSearched && testPlans.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              No testplans found.
            </div>
          ) : (
            testPlans.map((plan: any, index: number) => {
              const isOpening = openingPath === plan.path;
              return (
                <button
                  key={`${plan.path}:${index}`}
                  onClick={() => onOpen(plan)}
                  disabled={!!openingPath}
                  title={String(plan.path ?? "").replace(/\\/g, "\\\\")}
                  className="relative w-full text-left px-5 py-4 border-b border-border transition-colors group hover:bg-secondary/60 focus:bg-primary/8 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {plan.name}
                      </span>
                      <span className="text-[12px] text-muted-foreground truncate group-hover:text-foreground/70 transition-colors">
                        {String(plan.path ?? "").replace(/\\/g, "\\\\")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-muted-foreground border border-border px-2 py-0.5 whitespace-nowrap">
                        {plan.stepCount} steps
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground border border-border px-2 py-0.5 whitespace-nowrap">
                        {new Date(plan.lastModified).toLocaleString()}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </div>
                  </div>
                  {isOpening && (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-[1px]">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="ml-2 text-[12px] font-mono text-primary">
                        Opening...
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
          {testPlans.length} test plans
        </div>
      </div>
    </div>
  );
}
