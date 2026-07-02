import { Search, X } from "lucide-react";

interface InstrumentsPanelProps {
  instruments: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

export function InstrumentsPanel({
  instruments,
  search,
  setSearch,
  isLoading,
  isError,
  onClose,
}: InstrumentsPanelProps) {
  const closePanel = () => {
    onClose();
    setSearch("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      onClick={closePanel}
    >
      <div
        className="bg-card border border-border w-[660px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">
              Instruments
            </span>
          </div>
          <button
            onClick={closePanel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-3 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instruments..."
              className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              Loading instruments...
            </div>
          ) : isError ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
              Unable to load instruments.
            </div>
          ) : instruments.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
              {search ? "No matching instruments." : "No instruments available."}
            </div>
          ) : (
            instruments.map((instrument) => (
              <div
                key={`${instrument.name}:${instrument.assembly}`}
                className="px-5 py-4 border-b border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-foreground">
                        {instrument.name}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">
                        {instrument.baseType}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mb-1">
                      {instrument.assembly}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
          {instruments.length} instruments
        </div>
      </div>
    </div>
  );
}
