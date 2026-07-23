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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[1px]"
      >
        <div
          className="flex h-[620px] max-h-[88vh] w-[980px] max-w-[95vw] flex-col overflow-hidden border border-border bg-card shadow-2xl"
        >
          <div className="flex h-14 items-center justify-between border-b border-border bg-muted/30 px-5">
            <div className="min-w-0">
              <span className="block text-[15px] font-semibold text-foreground">
                Resources
              </span>
              <span className="block text-[12px] font-mono text-muted-foreground">
                Create, edit, and maintain bench resources
              </span>
            </div>
            <button
              onClick={closePanel}
              className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          <div className="shrink-0 border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 border border-border bg-background px-2.5 py-2.5">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="flex-1 bg-transparent text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
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
                className="flex h-9 items-center gap-2 border border-primary/30 bg-primary px-3.5 text-[13px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus size={13} /> Create Resource
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] gap-3 border-b border-border bg-muted/20 px-5 py-3 text-[12px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Name</div>
              <div>Instrument</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {isLoading ? (
              <div className="px-5 py-10 text-center text-[13px] font-mono text-muted-foreground">
                Loading resources...
              </div>
            ) : isError ? (
              <div className="px-5 py-10 text-center text-[13px] font-mono text-destructive">
                Unable to load resources.
              </div>
            ) : resources.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] font-mono text-muted-foreground">
                {search ? "No matching resources." : "No resources available."}
              </div>
            ) : (
              resources.map((resource) => (
                <div
                  key={resource.id}
                  className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] gap-3 border-b border-border px-5 py-3.5 text-[13px] font-mono transition-colors hover:bg-secondary/30"
                >
                  <div className="min-w-0 truncate font-semibold text-foreground" title={resource.name}>
                    {resource.name}
                  </div>
                  <div className="min-w-0 truncate text-muted-foreground" title={resource.instrument}>
                    {resource.instrument}
                  </div>
                  <div
                    className={`inline-flex w-fit items-center border px-2 py-0.5 font-semibold ${
                      resource.status === "Error"
                        ? "border-red-500/30 bg-red-500/10 text-red-500"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    }`}
                    title={resource.error}
                  >
                    {resource.status}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(resource)}
                      className="flex h-8 w-8 items-center justify-center border border-transparent text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary/80"
                      title="Edit resource"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(resource.id)}
                      className="flex h-8 w-8 items-center justify-center border border-transparent text-red-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                      title="Delete resource"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center border-t border-border bg-muted/20 px-4 py-2 text-[12px] font-mono text-muted-foreground">
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-[1px]"
        >
          <div
            className="flex h-[620px] max-h-[88vh] w-[980px] max-w-[95vw] flex-col overflow-hidden border border-border bg-card shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-border bg-muted/30 px-5">
              <span className="text-[15px] font-semibold text-foreground">
                Create {selectedResourceInstrument || "Resource"}
              </span>
              <button
                onClick={onCloseCreate}
                className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
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
                    className="h-10 w-full border border-border bg-background px-2.5 text-[13px] font-mono text-foreground outline-none transition-colors focus:border-primary"
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
                  <label className="mb-1 block text-[12px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan Name
                  </label>
                  <input
                    value={resourcePlanName}
                    onChange={(event) => setResourcePlanName(event.target.value)}
                    placeholder="Enter plan name"
                    className="h-10 w-full border border-border bg-background px-2.5 text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              {isResourceSchemaLoading ? (
                <div className="border border-dashed border-border bg-muted/20 py-10 text-center text-[13px] font-mono text-muted-foreground">
                  Loading resource schema...
                </div>
              ) : selectedResourceInstrument ? (
                <>
                  {resourceSchemaError && (
                    <div className="mb-4 border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[13px] font-mono text-muted-foreground">
                      {resourceSchemaError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                    {resourceSchemaProperties.map(renderResourceSchemaField)}
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-border bg-muted/20 py-10 text-center text-[13px] font-mono text-muted-foreground">
                  Select an instrument to load resource fields.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-5 py-3">
              <button
                onClick={onCloseCreate}
                className="h-8 border border-border px-4 text-[13px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={onSave}
                disabled={!selectedResourceInstrument || isResourceSchemaLoading}
                className="flex h-8 items-center gap-2 bg-primary px-4 text-[13px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
