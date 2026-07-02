import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

interface ResourcesPanelProps {
  resources: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  showCreateResource: boolean;
  setShowCreateResource: (value: boolean) => void;
  onClose: () => void;
  onEdit: (resource: any) => void;
  onDelete: (resourceId: string) => void;
  onSave: () => void;
  onCloseCreate: () => void;
  resourcePlanName: string;
  setResourcePlanName: (value: string) => void;
  selectedResourceInstrument: string;
  setSelectedResourceInstrument: (value: string) => void;
  browsableResourceInstruments: any[];
  isResourceSchemaLoading: boolean;
  resourceSchemaError: string;
  resourceSchemaProperties: any[];
  renderResourceSchemaField: (property: any) => ReactNode;
}

export function ResourcesPanel({
  resources,
  search,
  setSearch,
  isLoading,
  isError,
  showCreateResource,
  setShowCreateResource,
  onClose,
  onEdit,
  onDelete,
  onSave,
  onCloseCreate,
  resourcePlanName,
  setResourcePlanName,
  selectedResourceInstrument,
  setSelectedResourceInstrument,
  browsableResourceInstruments,
  isResourceSchemaLoading,
  resourceSchemaError,
  resourceSchemaProperties,
  renderResourceSchemaField,
}: ResourcesPanelProps) {
  const closePanel = () => {
    onClose();
    setShowCreateResource(false);
    setSearch("");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
        onClick={closePanel}
      >
        <div
          className="bg-card border border-border w-[760px] max-w-[92vw] h-[540px] max-h-[85vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-foreground">
                Resources
              </span>
            </div>
            <button
              onClick={closePanel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
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
              <button
                onClick={() => setShowCreateResource(true)}
                className="flex h-[34px] items-center gap-2 px-3 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus size={12} /> Create New Resource
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] gap-3 px-5 py-3 border-b border-border bg-muted/20 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Name</div>
              <div>Instrument</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {isLoading ? (
              <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                Loading resources...
              </div>
            ) : isError ? (
              <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">
                Unable to load resources.
              </div>
            ) : resources.length === 0 ? (
              <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">
                {search ? "No matching resources." : "No resources available."}
              </div>
            ) : (
              resources.map((resource) => (
                <div
                  key={resource.id}
                  className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr] gap-3 px-5 py-4 border-b border-border text-[12px] font-mono"
                >
                  <div className="font-semibold text-foreground">
                    {resource.name}
                  </div>
                  <div className="text-muted-foreground">
                    {resource.instrument}
                  </div>
                  <div
                    className={`font-semibold ${
                      resource.status === "Error"
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                    title={resource.error}
                  >
                    {resource.status}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEdit(resource)}
                      className="text-primary hover:text-primary/80"
                      title="Edit resource"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(resource.id)}
                      className="text-red-500 hover:text-red-400"
                      title="Delete resource"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono flex items-center">
            <span>{resources.length} resources</span>
            <div className="ml-auto flex items-center gap-3">
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled
              >
                <ChevronLeft size={14} />
              </button>
              <span>1 / 1</span>
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                disabled
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateResource && (
        <div
          className="fixed inset-0 bg-background-200/75 flex items-center justify-center z-[60]"
          onClick={onCloseCreate}
        >
          <div
            className="bg-card border border-border w-[760px] max-w-[92vw]  h-[540px] max-h-[88vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <span className="text-[13px] font-semibold text-foreground">
                Create {selectedResourceInstrument || "Resource"}
              </span>
              <button
                onClick={onCloseCreate}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Instrument
                </label>
                <select
                  value={selectedResourceInstrument}
                  onChange={(event) => {
                    const selected = browsableResourceInstruments.find(
                      (inst: any) => inst.name === event.target.value,
                    );
                    if (selected) {
                      setSelectedResourceInstrument(selected.name);
                    }
                  }}
                  className="w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select instrument</option>
                  {browsableResourceInstruments.map((instrument: any) => (
                    <option
                      key={`${instrument.name}:${instrument.assembly}`}
                      value={instrument.name}
                    >
                      {instrument.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Plan Name
                </label>
                <input
                  value={resourcePlanName}
                  onChange={(event) => setResourcePlanName(event.target.value)}
                  placeholder="Enter plan name"
                  className="w-full bg-background border border-border px-2.5 py-2 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              {isResourceSchemaLoading ? (
                <div className="py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Loading resource schema...
                </div>
              ) : selectedResourceInstrument ? (
                <>
                  {resourceSchemaError && (
                    <div className="border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[12px] font-mono text-muted-foreground">
                      {resourceSchemaError}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {resourceSchemaProperties.map(renderResourceSchemaField)}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Select an instrument to load resource fields.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
              <button
                onClick={onCloseCreate}
                className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                onClick={onSave}
                disabled={!selectedResourceInstrument || isResourceSchemaLoading}
                className="h-8 px-4 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Save size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
