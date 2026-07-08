import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Filter, FilePlus, Package, Plus, RefreshCw, Search, Upload, X } from "lucide-react";
import type { CtxMenu, DutItem, InstrumentItem, LibraryItem, PlanMeta, Plugin } from "../../types/editor";
import { TYPE_LABEL, TYPE_STRIPE } from "../../constants/editor";
import { TypeIcon } from "./atoms";

const matchesPluginSearch = (plugin: Plugin, query: string) => {
  const search = query.trim().toLowerCase();
  if (!search) return true;

  const values = [
    plugin.name,
    plugin.description,
    plugin.author,
    plugin.version,
    plugin.packageName,
    plugin.pluginName,
    ...(plugin.steps ?? []).flatMap(step => [step.name, step.description, step.category]),
  ];

  return values.some(value => String(value ?? "").toLowerCase().includes(search));
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  required,
  error,
  helper,
}: any) {
  const cls = `w-full bg-background border px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none transition-colors ${error
    ? "border-red-500/70 focus:border-red-500"
    : "border-border focus:border-primary"
    }`;
  return (
    <div>
      <label className="mb-1 block text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
        {label}{required ? " *" : ""}
      </label>
      {textarea
        ? <textarea className={`${cls} h-16 resize-none`} value={value} onChange={onChange} placeholder={placeholder} />
        : <input className={cls} value={value} onChange={onChange} placeholder={placeholder} />}
      {error && <p className="mt-1 text-[11px] font-mono text-red-500">{error}</p>}
      {!error && helper && <p className="mt-1 text-[11px] font-mono text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function NewPlanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: PlanMeta) => void }) {
  const [meta, setMeta] = useState<PlanMeta>({
    name: "",
    description: "",
    author: "",
    version: "1.0.0",
    dutName: "",
    dutSerial: "",
    dutModel: "",
    dutFirmware: "",
  });

  const [errors, setErrors] = useState({
    name: "",
  });

  const upd = (k: keyof PlanMeta) => (e: any) => {
    const value = e.target.value;

    setMeta((m) => ({
      ...m,
      [k]: value,
    }));

    if (k === "name") {
      setErrors((prev) => ({
        ...prev,
        name: value.trim() ? "" : "Plan Name is required.",
      }));
    }
  };

  const handleCreate = () => {
    const newErrors = {
      name: meta.name.trim() ? "" : "Plan Name is required.",
    };

    setErrors(newErrors);

    if (newErrors.name) return;

    onCreate(meta);
  };

  const canCreate = meta.name.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[620px] max-w-[94vw] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary shrink-0">
              <FilePlus size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-foreground">New Test Plan</div>
              <div className="truncate text-[12px] font-mono text-muted-foreground">Create metadata before adding steps and resources</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-sm border border-border bg-background/30 p-4 space-y-4">
            <Field
              label="Plan Name"
              required
              value={meta.name}
              onChange={upd("name")}
              placeholder="e.g. RF Board Validation v3"
              error={errors.name}
              helper="Use a unique, searchable plan name"
            />
            <Field
              label="Description"
              value={meta.description}
              onChange={upd("description")}
              placeholder="What does this plan verify?"
              textarea
              helper="Summarize objective, scope, or target board"
            />

            <div className="my-1 h-px bg-border" />
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Ownership</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author" value={meta.author} onChange={upd("author")} placeholder="Engineer name" helper="Owner or creator of this test plan" />
              <Field label="Version" value={meta.version} onChange={upd("version")} placeholder="1.0.0" helper="Semantic version recommended" />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-5 py-3 border-t border-border bg-muted/20">
          <div className="text-[11px] font-mono text-muted-foreground">Required fields: Plan Name</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-8 px-3 border border-border text-[12px] font-mono text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="flex items-center gap-1 px-4 h-8 bg-primary text-primary-foreground text-[12px] font-mono font-semibold transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={12} />
              Create Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Step Modal ───────────────────────────────────────────────────────────

export function SaveDestinationModal({
  defaultPath,
  onCancel,
  onSave,
}: {
  defaultPath: string;
  onCancel: () => void;
  onSave: (path: string) => void;
}) {
  const [destinationPath, setDestinationPath] = useState("");

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-card border border-border w-[520px] max-w-[94vw] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary shrink-0">
              <Download size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-foreground">Save Test Plan</div>
              <div className="truncate text-[12px] font-mono text-muted-foreground">Choose destination path for this plan</div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5">
          <Field
            label="Destination Path (Optional)"
            value={destinationPath}
            onChange={(event: any) => setDestinationPath(event.target.value)}
            placeholder={defaultPath}
            helper={`Leave empty to use ${defaultPath}`}
          />
        </div>

        <div className="flex justify-between items-center px-5 py-3 border-t border-border bg-muted/20">
          <div className="text-[11px] font-mono text-muted-foreground"></div>
          <div className="flex gap-2">
            {/* <button onClick={onCancel} className="h-8 px-3 border border-border text-[12px] font-mono text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Cancel</button> */}
            <button
              onClick={() => onSave(destinationPath)}
              className="flex items-center gap-1 px-4 h-8 bg-primary text-primary-foreground text-[12px] font-mono font-semibold transition-colors hover:bg-primary/90"
            >
              <Check size={12} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddStepModal({
  library,
  onAdd,
  onClose,
}: {
  library: LibraryItem[];
  onAdd: (i: LibraryItem) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = library.filter((item) => {
    const haystack = `${item.name} ${item.description}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border w-[620px] h-[480px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Plus size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">
              Add Step
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2 border border-border px-2 py-1.5 bg-background">
              <Search
                size={12}
                className="text-muted-foreground shrink-0"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search steps..."
                className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="py-8 text-center text-[12px] text-muted-foreground font-mono">
                No matching steps
              </div>
            )}

            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onAdd(item);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-secondary group transition-colors border-b border-border/40"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-[3px] h-5 shrink-0"
                    style={{
                      background: TYPE_STRIPE[item.type] || "#64748b",
                    }}
                  />

                  <TypeIcon type={item.type} size={13} />

                  <span className="text-[13px] font-mono text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </span>

                  <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-1.5">
                    {TYPE_LABEL[item.type] || "—"}
                  </span>

                  {item.pluginId && (
                    <span className="text-[10px] font-mono text-primary border border-primary/30 px-1.5">
                      plugin
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground mt-1 pl-8">
                  {item.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
          {filtered.length} steps · click to add
        </div>
      </div>
    </div>
  );
}

// ─── Filter Dropdown (shared) ─────────────────────────────────────────────────

function FilterDropdown({
  open,
  onOpenChange,
  activeCount,
  title,
  onClear,
  children,
  popoverWidth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  title: string;
  onClear: () => void;
  children: React.ReactNode;
  popoverWidth?: string;
}) {
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => onOpenChange(!open)}
        className={`flex h-9 items-center gap-1.5 border px-2.5 text-[11px] font-mono transition-colors ${activeCount > 0
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        title="Filter"
      >
        <Filter size={14} />
        {activeCount > 0 && (
          <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onOpenChange(false)} />
          <div className={`absolute right-0 top-full z-20 mt-1 ${popoverWidth ?? "w-60"} border border-border bg-popover`}>
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
              {activeCount > 0 && (
                <button onClick={onClear} className="text-[10px] font-mono text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto py-1">{children}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Plugin Manager ───────────────────────────────────────────────────────────
export function PluginManager({
  plugins, installedPlugins, onInstall, onUninstall, onUninstallPackage, onUpload, onClose,
  installedSearch, setInstalledSearch, browseSearch, setBrowseSearch,
  isInstalledLoading, isAvailableLoading,
}: {
  plugins: Plugin[]; installedPlugins: Plugin[]; onInstall: (id: string) => Promise<void>; onUninstall: (id: string) => Promise<void>; onUninstallPackage: (id: string) => Promise<void>; onUpload: (file: File) => Promise<void>; onClose: () => void;
  installedSearch: string; setInstalledSearch: (v: string) => void;
  browseSearch: string; setBrowseSearch: (v: string) => void;
  isInstalledLoading?: boolean; isAvailableLoading?: boolean;
}) {
  const [tab, setTab] = useState<"installed" | "browse" | "upload">("installed");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [uninstallingId, setUninstallingId] = useState<string | null>(null);

  // ── Filter state: Available tab only ──
  const [availableFilterOpen, setAvailableFilterOpen] = useState(false);
  const [availableStatusFilter, setAvailableStatusFilter] = useState<"all" | "installed" | "not_installed">("all");

  const installedTotal = installedPlugins.length;
  const availableTotal = plugins.length;

  const availableActiveFilterCount = (availableStatusFilter !== "all" ? 1 : 0);

  const installed = installedPlugins.filter(plugin =>
    matchesPluginSearch(plugin, installedSearch)
  );

  const available = plugins.filter(plugin =>
    matchesPluginSearch(plugin, browseSearch) &&
    (availableStatusFilter === "all" || (availableStatusFilter === "installed" ? Boolean(plugin.isInstalled) : !plugin.isInstalled))
  );

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await onUpload(uploadFile);
      setUploadFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUninstall = async (id: string) => {
    if (uninstallingId) return;
    setUninstallingId(id);
    try {
      await onUninstall(id);
    } finally {
      setUninstallingId(null);
    }
  };

  const handlePackageUninstall = async (id: string) => {
    if (uninstallingId) return;
    setUninstallingId(id);
    try {
      await onUninstallPackage(id);
    } finally {
      setUninstallingId(null);
    }
  };

  const handleInstall = async (id: string) => {
    if (installingId) return;
    setInstallingId(id);
    try {
      await onInstall(id);
    } finally {
      setInstallingId(null);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key === "1") {
        event.preventDefault();
        setTab("installed");
      }
      if (event.key === "2") {
        event.preventDefault();
        setTab("browse");
      }
      if (event.key === "3") {
        event.preventDefault();
        setTab("upload");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={onClose}>
      <div className="flex h-[620px] w-[920px] max-w-[96vw] flex-col border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex h-14 items-center justify-between border-b border-border bg-muted/30 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              <Package size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-foreground">Plugin Manager</div>
              <div className="truncate text-[12px] font-mono text-muted-foreground">Install, update, remove, and upload plugins</div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        <div className="relative flex shrink-0 items-end border-b border-border bg-background px-3">
          {(["installed", "browse", "upload"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mt-1 border-b-2 px-4 py-2.5 text-[12px] font-mono font-semibold uppercase tracking-wider transition-colors ${tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t === "installed"
                ? `Installed (${installed.length}/${installedTotal})`
                : t === "browse"
                  ? `Available (${available.length}/${availableTotal})`
                  : "Upload"}
            </button>
          ))}
          <div className="pointer-events-none absolute bottom-2 right-3 text-right text-[10px] font-mono text-muted-foreground/80">
            Alt+1 Installed · Alt+2 Available · Alt+3 Upload
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {tab === "installed" && (
            <div className="min-h-full">
              <div className="sticky top-0 z-10 border-b border-border bg-card px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 min-w-[260px] flex-1 items-center gap-2 border border-border bg-background px-2.5">
                    <Search size={12} className="shrink-0 text-muted-foreground" />
                    <input
                      value={installedSearch}
                      onChange={e => setInstalledSearch(e.target.value)}
                      placeholder="Search installed plugins..."
                      className="min-w-0 flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    {installedSearch && (
                      <button onClick={() => setInstalledSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground" title="Clear search">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground">{installed.length} visible</div>
                </div>
              </div>

              {isInstalledLoading ? (
                <div className="py-12 text-center text-[12px] font-mono text-muted-foreground">Loading installed plugins...</div>
              ) : installed.length === 0 ? (
                <div className="py-12 text-center text-[12px] font-mono text-muted-foreground">
                  {installedSearch ? "No matching plugins" : "No plugins installed"}
                </div>
              ) : (
                <div>
                  {installed.map((p, index) => (
                    <div key={`${p.id}:${p.packageName ?? ""}:${p.assembly ?? ""}:${index}`} className="border-b border-l-2 border-l-transparent border-border px-5 py-4 transition-colors hover:border-l-primary/60 hover:bg-secondary/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex min-w-0 items-center gap-2">
                            <span className="flex-1 truncate text-[14px] font-semibold text-foreground" title={p.name}>{p.name}</span>
                          </div>
                          {(p.description || p.author) && (
                            <div className="mb-2 text-[12px] text-muted-foreground">
                              {p.description || "No description"}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {p.baseType && <span className="border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground" title={p.baseType}>{p.baseType}</span>}
                            {p.assembly && <span className="border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground" title={p.assembly}>{p.assembly}</span>}
                            {p.packageName && <span className="border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground" title={p.packageName}>{p.packageName}</span>}
                          </div>
                        </div>

                        <div className="mt-0.5 flex min-w-[170px] shrink-0 items-center justify-end gap-3">
                          <span className="shrink-0 text-[11px] font-mono text-emerald-500">installed</span>
                          <button
                            onClick={() => handleUninstall(p.id)}
                            disabled={uninstallingId === p.id}
                            className="h-8 shrink-0 border border-border px-3 text-[11px] font-mono text-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {uninstallingId === p.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "browse" && (
            <div className="min-h-full">
              <div className="sticky top-0 z-10 border-b border-border bg-card px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-9 min-w-[260px] flex-1 items-center gap-2 border border-border bg-background px-2.5">
                    <Search size={12} className="shrink-0 text-muted-foreground" />
                    <input
                      value={browseSearch}
                      onChange={e => setBrowseSearch(e.target.value)}
                      placeholder="Search available plugins..."
                      className="min-w-0 flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    {browseSearch && (
                      <button onClick={() => setBrowseSearch("")} className="shrink-0 text-muted-foreground hover:text-foreground" title="Clear search">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <FilterDropdown
                    open={availableFilterOpen}
                    onOpenChange={setAvailableFilterOpen}
                    activeCount={availableActiveFilterCount}
                    title="Filter"
                    onClear={() => setAvailableStatusFilter("all")}
                    popoverWidth="w-44"
                  >
                    <div className="border-border px-3 py-2">
                      <div className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80">Status</div>
                      <div className="space-y-1">
                        {([
                          { value: "all", label: "All" },
                          { value: "installed", label: "Installed" },
                          { value: "not_installed", label: "Not Installed" },
                        ] as const).map(opt => (
                          <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-[12px] font-mono text-foreground">
                            <input
                              type="radio"
                              name="available-status-filter"
                              checked={availableStatusFilter === opt.value}
                              onChange={() => setAvailableStatusFilter(opt.value)}
                              className="accent-primary"
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </FilterDropdown>

                  <div className="text-[11px] font-mono text-muted-foreground">{available.length} visible</div>
                </div>
              </div>

              {isAvailableLoading ? (
                <div className="py-12 text-center text-[12px] font-mono text-muted-foreground">Loading packages...</div>
              ) : available.length === 0 ? (
                <div className="py-12 text-center text-[12px] font-mono text-muted-foreground">
                  {browseSearch || availableActiveFilterCount > 0 ? "No matching packages" : "No packages available"}
                </div>
              ) : (
                <div>
                  {available.map((p, index) => (
                    <div key={`${p.id}:${p.packageName ?? ""}:${p.version ?? ""}:${index}`} className="border-b border-l-2 border-l-transparent border-border px-5 py-4 transition-colors hover:border-l-primary/60 hover:bg-secondary/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex min-w-0 items-center gap-2">
                            <span className="truncate text-[14px] font-semibold text-foreground">{p.name}</span>
                            <span className="shrink-0 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">v{p.version}</span>
                          </div>
                          <div className="mb-1 text-[12px] text-muted-foreground">{p.description || "No description"}</div>
                          <div className="text-[11px] font-mono text-muted-foreground/70">by {p.author || "unknown"} · {p.steps?.length ?? 0} steps</div>
                          {(p.steps ?? []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(p.steps ?? []).slice(0, 6).map(s => (
                                <span key={s.id} className="border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{s.name}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => handleInstall(p.id)}
                            disabled={installingId === p.id}
                            className="flex items-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-mono text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download size={11} /> {installingId === p.id ? (p.isInstalled ? "Updating..." : "Installing...") : (p.isInstalled ? "Update" : "Install")}
                          </button>

                          {p.isInstalled && (
                            <button
                              onClick={() => handlePackageUninstall(p.id)}
                              disabled={uninstallingId === p.id}
                              className="border border-border px-2.5 py-1.5 text-[11px] font-mono text-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {uninstallingId === p.id ? "Uninstalling..." : "Uninstall"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "upload" && (
            <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col px-6 pt-8">
              <div className="mb-4 text-[13px] font-mono text-muted-foreground">
                Upload a <span className="text-primary">.zip</span> or <span className="text-primary">.dll</span> package to install a custom plugin.
              </div>

              <label className="block cursor-pointer border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/60 group">
                <Upload size={30} className="mx-auto mb-3 text-muted-foreground transition-colors group-hover:text-primary" />
                <div className="text-[13px] font-mono text-muted-foreground">
                  {uploadFile ? <span className="text-primary">{uploadFile.name}</span> : <>Drop file here or <span className="text-primary underline">browse</span></>}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/60">Supported: .zip, .dll</div>
                <input type="file" className="hidden" accept=".zip,.dll" onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
              </label>

              {uploadError && <div className="mt-3 text-[12px] font-mono text-red-500">{uploadError}</div>}

              <div className="sticky bottom-0 mt-auto border-t border-border bg-card py-3">
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex h-10 w-full items-center justify-center gap-2 bg-primary text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading
                    ? <><RefreshCw size={12} className="animate-spin" /> Installing...</>
                    : <><Upload size={12} /> {uploadFile ? "Upload Package" : "Select Package to Upload"}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

export function ContextMenu({ menu, onAction, onClose }: { menu: CtxMenu; onAction: (a: string, id: string) => void; onClose: () => void }) {
  const groups = [
    [{ label: "Add Step After", action: "add_after" }, { label: "Add Child Step", action: "add_child" }],
    [{ label: "Move Up", action: "move_up" }, { label: "Move Down", action: "move_down" }],
    [{ label: "Duplicate", action: "duplicate" }, { label: "Rename", action: "rename" }, { label: "Toggle Enable", action: "toggle" }, { label: "Toggle Breakpoint", action: "breakpoint" }],
    [{ label: "Delete", action: "delete", danger: true }],
  ];
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute bg-popover border border-border shadow-2xl w-48 py-1"
        style={{ left: Math.min(menu.x, window.innerWidth - 200), top: Math.min(menu.y, window.innerHeight - 260) }}
        onClick={e => e.stopPropagation()}>
        {groups.map((g, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-border my-1" />}
            {g.map(item => (
              <button key={item.action} onClick={() => { onAction(item.action, menu.stepId); onClose(); }}
                className={`w-full text-left px-4 py-1.5 text-[12px] font-mono transition-colors
                  ${"danger" in item && item.danger ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
