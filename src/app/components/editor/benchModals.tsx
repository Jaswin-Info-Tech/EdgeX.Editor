import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ArrowRight,
  Cable,
  Cpu,
  DatabaseZap,
  FileText,
  FolderKanban,
  MousePointerClick,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  addResource,
  deleteResource,
  getResources,
  getResourceSchema,
  extractTypeName,
  updateResource,
  type Resource,
  type ResourceSchemaProperty,
} from "../../api/resources"; // adjust path
import { renderEditor, type EditorContext } from "./PropertyEditors"; // adjust path

const labelCls =
  "block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

const mapDotNetTypeToEditorType = (type: string, hasEnum: boolean): string => {
  if (hasEnum) return "select";
  switch (type) {
    case "System.Boolean":
      return "checkbox";
    case "System.Int16":
    case "System.Int32":
    case "System.Int64":
    case "System.UInt16":
    case "System.UInt32":
    case "System.UInt64":
      return "integer";
    case "System.Single":
    case "System.Double":
    case "System.Decimal":
      return "number";
    case "System.String":
    default:
      return "text";
  }
};

const toEditorProp = (property: ResourceSchemaProperty) => {
  const hasEnum = (property.enumValues?.length ?? 0) > 0;
  return {
    name: property.name,
    displayName: property.displayName || property.name,
    editorType: mapDotNetTypeToEditorType(property.type, hasEnum),
    enumValues: property.enumValues ?? [],
  };
};

const emptyEditorContext: EditorContext = {
  instrumentOptions: [],
  testStepOptions: [],
  planStepOptions: [],
  resourceOptions: [],
};

const getBlankValue = (property: ResourceSchemaProperty): any => {
  const hasEnum = (property.enumValues?.length ?? 0) > 0;
  if (hasEnum) return "";
  switch (property.type) {
    case "System.Boolean":
      return false;
    default:
      return "";
  }
};

const coercePropertyValue = (property: ResourceSchemaProperty, rawValue: any): any => {
  const enumValues = property.enumValues ?? [];
  if (enumValues.length > 0) {
    if (typeof rawValue === "number" && enumValues[rawValue] !== undefined) {
      return enumValues[rawValue];
    }
    if (
      typeof rawValue === "string" &&
      /^\d+$/.test(rawValue) &&
      enumValues[Number(rawValue)] !== undefined
    ) {
      return enumValues[Number(rawValue)];
    }
    return rawValue;
  }
  return rawValue;
};

const getResourceDisplayName = (resource: Resource) =>
  resource.name ||
  resource.properties?.Name ||
  resource.properties?.name ||
  String((resource as any).dutName ?? (resource as any).model ?? resource.type ?? "");

type ResourceKind = "instrument" | "duts" | "connections";

interface KindConfig {
  resourceKind: ResourceKind;
  icon: (props: { size: number; className: string }) => ReactElement;
  panelTitle: string; // "Add Instrument"
  itemLabelSingular: string; // "instrument" (used in placeholders/messages)
  itemLabelCapitalized: string; // "Instrument"
  itemsEmptyMessage: string; // "No instruments available."
  itemsEmptyMessageFiltered: string; // "No matching instruments."
  loadingItemsMessage: string;
  errorItemsMessage: string;
  baseTypeFallback: string; // "Precision measurement instrument"
  noInstancesMessage: string; // "No existing instances of this instrument."
  footerAddedMessage: string; // "Will be added to the Instruments panel"
  footerUpdatedMessage: string; // "Will update the selected instrument resource"
  deleteIcon: (props: { size: number; className?: string }) => ReactElement;
  resolveTypeName: (item: any) => string;
  matchesResource: (resource: Resource, item: any, typeName: string) => boolean;
  getDisplayName: (resource: Resource) => string;
  coerceEnums?: boolean;
  useNameInputRef?: boolean;
}

const CONFIGS: Record<ResourceKind, KindConfig> = {
  instrument: {
    resourceKind: "instrument",
    icon: (p) => <Cable {...p} />,
    panelTitle: "Add Instrument",
    itemLabelSingular: "instrument",
    itemLabelCapitalized: "Instrument",
    itemsEmptyMessage: "No instruments available.",
    itemsEmptyMessageFiltered: "No matching instruments.",
    loadingItemsMessage: "Loading instruments...",
    errorItemsMessage: "Unable to load instruments.",
    baseTypeFallback: "Precision measurement instrument",
    noInstancesMessage: "No existing instances of this instrument.",
    footerAddedMessage: "Will be added to the Instruments panel",
    footerUpdatedMessage: "Will update the selected instrument resource",
    deleteIcon: (p) => <Trash2 {...p} />,
    resolveTypeName: (item) => String(item?.name ?? "").trim(),
    matchesResource: (resource, item) =>
      extractTypeName(resource.type) === item?.name,
    getDisplayName: (resource) => resource.name,
    useNameInputRef: true,
  },
  duts: {
    resourceKind: "duts",
    icon: (p) => <Cpu {...p} />,
    panelTitle: "Add DUT",
    itemLabelSingular: "DUT",
    itemLabelCapitalized: "DUT",
    itemsEmptyMessage: "No DUTs available.",
    itemsEmptyMessageFiltered: "No matching DUTs.",
    loadingItemsMessage: "Loading DUTs...",
    errorItemsMessage: "Unable to load DUTs.",
    baseTypeFallback: "Device under test",
    noInstancesMessage: "No existing instances of this DUT.",
    footerAddedMessage: "Will be added to the DUTs panel",
    footerUpdatedMessage: "Will update the selected DUT resource",
    deleteIcon: (p) => <Trash2 {...p} />,
    resolveTypeName: (item) => String(item?.type ?? item?.name ?? "").trim(),
    matchesResource: (resource, item, typeName) => {
      const typeNameExtracted = extractTypeName(typeName).toLowerCase();
      const selectedTypeLower = typeName.toLowerCase();
      const selectedNameLower = String(item?.name ?? "").toLowerCase();

      const rTypeName = extractTypeName(String(resource.type ?? "")).toLowerCase();
      const rInstrumentName = String((resource as any).instrument ?? "").toLowerCase();
      const rRawType = String(resource.type ?? "").toLowerCase();
      const rDisplayNameLower = String(getResourceDisplayName(resource)).toLowerCase();

      return (
        rTypeName === selectedTypeLower ||
        rTypeName === typeNameExtracted ||
        rInstrumentName === selectedTypeLower ||
        rInstrumentName === typeNameExtracted ||
        rRawType.includes(selectedTypeLower) ||
        rRawType.includes(typeNameExtracted) ||
        rDisplayNameLower === selectedNameLower
      );
    },
    getDisplayName: getResourceDisplayName,
    useNameInputRef: true,
  },
  connections: {
    resourceKind: "connections",
    icon: (p) => <Cable {...p} />,
    panelTitle: "Add Connection",
    itemLabelSingular: "connection",
    itemLabelCapitalized: "Connection",
    itemsEmptyMessage: "No connections available.",
    itemsEmptyMessageFiltered: "No matching connections.",
    loadingItemsMessage: "Loading connections...",
    errorItemsMessage: "Unable to load connections.",
    baseTypeFallback: "Connection interface",
    noInstancesMessage: "No existing instances of this connection.",
    footerAddedMessage: "Will be added to the Connections panel",
    footerUpdatedMessage: "Will update the selected connection resource",
    deleteIcon: (p) => <Trash2 {...p} />,
    resolveTypeName: (item) => String(item?.name ?? "").trim(),
    matchesResource: (resource, item) => {
      const selectedType = extractTypeName(String(item?.name ?? "")).toLowerCase();
      const resourceType = extractTypeName(String(resource.type ?? "")).toLowerCase();
      return resourceType === selectedType;
    },
    getDisplayName: (resource) => resource.name,
    coerceEnums: true,
    useNameInputRef: false,
  },
};

interface GenericResourcePanelProps {
  config: KindConfig;
  items: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

function GenericResourcePanel({
  config,
  items,
  search,
  setSearch,
  isLoading,
  isError,
  onClose,
}: GenericResourcePanelProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [resourceName, setResourceName] = useState("");
  const resourceNameInputRef = useRef<HTMLInputElement>(null);

  const [activeBlade, setActiveBlade] = useState<"types" | "resources" | "editor">("types");
  const [schemaProperties, setSchemaProperties] = useState<ResourceSchemaProperty[]>([]);
  const [schemaPropertyValues, setSchemaPropertyValues] = useState<Record<string, any>>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState(false);
  const [instanceSearch, setInstanceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "error">("all");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [showBasicsPanel, setShowBasicsPanel] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [saveResourceLoading, setSaveResourceLoading] = useState(false);
  const [saveResourceError, setSaveResourceError] = useState("");
  const [deleteResourceLoading, setDeleteResourceLoading] = useState(false);
  const [deleteResourceError, setDeleteResourceError] = useState("");
  const [resourcePendingDelete, setResourcePendingDelete] = useState<Resource | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => `${item.name}:${item.assembly}` === selectedKey) ?? null,
    [items, selectedKey],
  );

  const selectedTypeName = useMemo(
    () => (selectedItem ? config.resolveTypeName(selectedItem) : ""),
    [config, selectedItem],
  );

  useEffect(() => {
    if (!selectedItem) {
      if (selectedKey) setSelectedKey("");
      setResourceName("");
      setSelectedResourceId("");
      setActiveBlade("types");
      return;
    }
  }, [selectedItem, selectedKey]);

  useEffect(() => {
    if (!selectedTypeName) {
      setSchemaProperties([]);
      setSchemaPropertyValues({});
      return;
    }

    let cancelled = false;
    setSchemaLoading(true);
    setSchemaError(false);

    getResourceSchema(selectedTypeName, config.resourceKind)
      .then((schema) => {
        if (cancelled) return;
        const properties = schema.properties ?? [];
        setSchemaProperties(properties);

        // Start blank — values only get filled when an existing resource is selected
        const blankValues: Record<string, any> = {};
        properties.forEach((property) => {
          blankValues[property.name] = getBlankValue(property);
        });
        setSchemaPropertyValues(blankValues);
      })
      .catch(() => {
        if (cancelled) return;
        setSchemaError(true);
        setSchemaProperties([]);
        setSchemaPropertyValues({});
      })
      .finally(() => {
        if (!cancelled) setSchemaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTypeName, config.resourceKind]);

  // ─── Fetch all existing resources once ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setResourcesLoading(true);
    setResourcesError(false);

    getResources()
      .then((data) => {
        if (!cancelled) setResources(data);
      })
      .catch(() => {
        if (!cancelled) setResourcesError(true);
      })
      .finally(() => {
        if (!cancelled) setResourcesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Resources that match the currently selected item type ───────────────
  const matchingResources = useMemo(() => {
    if (!selectedTypeName) return [];
    return resources.filter((resource) =>
      config.matchesResource(resource, selectedItem, selectedTypeName),
    );
  }, [resources, selectedTypeName, selectedItem, config]);

  const filteredResources = useMemo(() => {
    const searchLower = instanceSearch.trim().toLowerCase();
    return matchingResources.filter((resource) => {
      if (statusFilter === "active" && resource.status !== "Active") return false;
      if (statusFilter === "error" && resource.status !== "Error") return false;
      if (!searchLower) return true;

      const displayName = config.getDisplayName(resource) || resource.name || "";
      const typeName = extractTypeName(String(resource.type ?? ""));
      return (
        displayName.toLowerCase().includes(searchLower) ||
        String(typeName).toLowerCase().includes(searchLower)
      );
    });
  }, [matchingResources, instanceSearch, statusFilter, config]);

  const selectedResource = useMemo(
    () => matchingResources.find((r) => r.id === selectedResourceId) ?? null,
    [matchingResources, selectedResourceId],
  );

  const closePanel = () => {
    setActiveBlade("types");
    onClose();
    setSearch("");
  };

  const selectItem = (item: any) => {
    setSelectedKey(`${item.name}:${item.assembly}`);
    setActiveBlade("resources");
    setResourceName("");
    setSelectedResourceId("");
    setInstanceSearch("");
    setStatusFilter("all");
    setSaveResourceError("");
    setDeleteResourceError("");
  };

  const resetToBlank = () => {
    setSelectedResourceId("");
    setResourceName("");
    const blankValues: Record<string, any> = {};
    schemaProperties.forEach((property) => {
      blankValues[property.name] = getBlankValue(property);
    });
    setSchemaPropertyValues(blankValues);
  };

  // ─── "Add New" button on the instances grid opens a blank editor modal ───
  const openAddModal = () => {
    resetToBlank();
    setShowBasicsPanel(true);
    setShowConfigPanel(false);
    setSaveResourceError("");
    setDeleteResourceError("");
    setActiveBlade("editor");
  };

  const selectResource = (resource: Resource) => {
    setSelectedResourceId(resource.id);
    setShowBasicsPanel(true);
    setShowConfigPanel(true);
    setResourceName(resource.name);
    setActiveBlade("editor");
    setSaveResourceError("");
    setDeleteResourceError("");

    setSchemaPropertyValues((prev) => {
      const next = { ...prev };
      schemaProperties.forEach((property) => {
        const hasProp = !!resource.properties && property.name in resource.properties;
        if (hasProp) {
          const rawValue = resource.properties[property.name];
          if (rawValue === null || rawValue === undefined) {
            next[property.name] = getBlankValue(property);
          } else {
            next[property.name] = config.coerceEnums
              ? coercePropertyValue(property, rawValue)
              : rawValue;
          }
        } else {
          next[property.name] = getBlankValue(property);
        }
      });
      return next;
    });
  };

  const closeEditorModal = () => {
    setShowBasicsPanel(true);
    setShowConfigPanel(false);
    setActiveBlade("resources");
    setSaveResourceError("");
    setDeleteResourceError("");
  };

  const editableProperties = schemaProperties.filter((p) => p.isEditable);

  useEffect(() => {
    if (activeBlade !== "editor") return;
    if (resourceName.trim() && !showConfigPanel) {
      setShowConfigPanel(true);
    }
  }, [activeBlade, resourceName, showConfigPanel]);

  const handleSave = async () => {
    const pluginTypeName = selectedTypeName;
    const trimmedResourceName = (
      config.useNameInputRef ? resourceNameInputRef.current?.value ?? resourceName : resourceName
    ).trim();

    if (!pluginTypeName || !trimmedResourceName) return;

    setSaveResourceLoading(true);
    setSaveResourceError("");
    const isUpdate = Boolean(selectedResource);
    const toastId = toast.loading(
      isUpdate
        ? `Updating ${selectedResource?.name}...`
        : `Creating ${trimmedResourceName}...`,
    );

    try {
      const properties = editableProperties.reduce<Record<string, any>>((values, property) => {
        if (!property.name || property.name.toLowerCase() === "name") return values;
        values[property.name] = schemaPropertyValues[property.name];
        return values;
      }, {});

      if (selectedResource) {
        await updateResource({
          resourceKind: config.resourceKind,
          name: selectedResource.name,
          newName: trimmedResourceName,
          properties,
        });
      } else {
        await addResource({
          resourceKind: config.resourceKind,
          pluginTypeName,
          name: trimmedResourceName,
          properties,
        });
      }

      const updatedResources = await getResources();
      setResources(updatedResources);
      toast.success(
        isUpdate
          ? `${trimmedResourceName} updated successfully`
          : `${trimmedResourceName} created successfully`,
        { id: toastId },
      );
      setActiveBlade("resources");
      resetToBlank();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isUpdate
            ? `Unable to update ${config.itemLabelSingular}.`
            : `Unable to add ${config.itemLabelSingular}.`;
      setSaveResourceError(message);
      toast.error(message, { id: toastId });
    } finally {
      setSaveResourceLoading(false);
    }
  };

  const requestDelete = (resource: Resource) => {
    setResourcePendingDelete(resource);
  };

  const cancelDelete = () => {
    setResourcePendingDelete(null);
  };

  const confirmDelete = async () => {
    const resourceToDelete = resourcePendingDelete;
    if (!resourceToDelete) return;

    setDeleteResourceLoading(true);
    setDeleteResourceError("");
    setSaveResourceError("");
    const toastId = toast.loading(`Deleting ${resourceToDelete.name}...`);

    try {
      await deleteResource({
        resourceKind: config.resourceKind,
        name: resourceToDelete.name,
      });

      const updatedResources = await getResources();
      setResources(updatedResources);
      if (resourceToDelete.id === selectedResourceId) {
        resetToBlank();
        setActiveBlade("resources");
      }
      toast.success(`${resourceToDelete.name} deleted successfully`, { id: toastId });
      setResourcePendingDelete(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `Unable to delete ${config.itemLabelSingular}.`;
      setDeleteResourceError(message);
      toast.error(message, { id: toastId });
    } finally {
      setDeleteResourceLoading(false);
    }
  };

  const Icon = config.icon;
  const DeleteIcon = config.deleteIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
      onClick={closePanel}
    >
      <div
        className="flex h-full w-[1080px] max-w-[96vw] flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center border border-primary/30 bg-primary/5 text-primary">
              <DatabaseZap size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-foreground">
                {config.panelTitle}
              </div>
              <div className="truncate text-[11px] font-mono text-muted-foreground">
                Manage {config.itemLabelSingular} types and instances
              </div>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="flex h-8 w-8 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary/80 hover:text-foreground"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 flex-col bg-card">
            <div className="border-b border-border bg-muted/10 px-4 py-2">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setActiveBlade("types")}
                  className={`transition-colors ${activeBlade === "types" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {config.itemLabelCapitalized} Types
                </button>
                {selectedItem && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <button
                      onClick={() => setActiveBlade("resources")}
                      className={`max-w-[220px] truncate transition-colors ${activeBlade === "resources" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {selectedItem.name} Resources
                    </button>
                  </>
                )}
                {activeBlade === "editor" && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground">Configuration</span>
                  </>
                )}
              </div>
            </div>

            <div className="min-h-0 flex flex-1 overflow-hidden bg-background">
              {activeBlade === "types" && (
                <div className="flex h-full w-[310px] shrink-0 flex-col border-r border-border bg-card">
                <div className="border-b border-border px-3 py-3">
                  <div className="mb-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    {config.itemLabelCapitalized} Types
                  </div>
                  <div className="flex h-8 items-center gap-2 border border-border bg-background px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                    <Search size={12} className="shrink-0 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${config.itemLabelSingular} type...`}
                      className="min-w-0 flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        title="Clear search"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="border-b border-border px-3 py-1.5 text-[10px] font-mono text-muted-foreground">
                  {items.length} types
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                  {isLoading ? (
                    <div className="px-3 py-8 text-center text-[13px] font-mono text-muted-foreground">
                      {config.loadingItemsMessage}
                    </div>
                  ) : isError ? (
                    <div className="px-3 py-8 text-center text-[13px] font-mono text-destructive">
                      {config.errorItemsMessage}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="px-3 py-8 text-center text-[13px] font-mono text-muted-foreground">
                      {search ? config.itemsEmptyMessageFiltered : config.itemsEmptyMessage}
                    </div>
                  ) : (
                    items.map((item) => {
                      const key = `${item.name}:${item.assembly}`;
                      const isSelected = key === selectedKey;
                      return (
                        <button
                          key={key}
                          onClick={() => selectItem(item)}
                          title={item.name}
                          className={`mb-1 flex w-full items-start gap-2 border px-2 py-2 text-left transition-colors ${isSelected
                            ? "border-primary/40 bg-primary/8 shadow-[inset_2px_0_0_0_var(--color-primary)]"
                            : "border-border/60 hover:border-border hover:bg-secondary/30"
                            }`}
                        >
                          <Icon size={15} className="mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-semibold text-foreground">{item.name}</div>
                            <div className="mt-0.5 truncate text-[10px] font-mono text-muted-foreground">
                              {item.assembly || config.baseTypeFallback}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              )}

              {activeBlade === "types" && (
                <div className="blade-enter-soft flex min-w-0 flex-1 flex-col bg-card">
                  <div className="border-b border-border bg-muted/10 px-4 py-3">
                    <div className="text-[14px] font-semibold text-foreground">Resource Setup Workflow</div>
                    <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                      Follow the guided flow to select a type, manage instances, and apply configuration safely.
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="border border-border bg-card p-3">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                          <MousePointerClick size={15} className="text-primary" />
                          Step 1: Pick Type
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                          <div>Select the required Instrument, DUT, or Connection type from the left blade.</div>
                          <div>Use the search box to quickly narrow large catalogs by name or assembly.</div>
                        </div>
                      </div>

                      <div className="border border-border bg-card p-3">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                          <FolderKanban size={15} className="text-primary" />
                          Step 2: Manage Instances
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                          <div>Review existing instances in a structured grid with type and health status.</div>
                          <div>Filter by status, search by name, or create a new instance with Add.</div>
                        </div>
                      </div>

                      <div className="border border-border bg-card p-3">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                          <SlidersHorizontal size={15} className="text-primary" />
                          Step 3: Configure
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                          <div>Open the configuration blade to edit resource name and parameters.</div>
                          <div>Save to persist changes immediately to backend resource configuration.</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border border-border bg-card p-3">
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                        <FileText size={15} className="text-primary" />
                        Execution Path
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                        <span>Select type</span>
                        <ArrowRight size={12} />
                        <span>Manage instances</span>
                        <ArrowRight size={12} />
                        <span>Configure and save</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedItem && activeBlade === "resources" && (
                <div className="blade-enter-soft flex h-full min-w-0 flex-1 border-r border-border bg-card">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="sticky top-0 z-20 border-b border-border bg-card px-4 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                            {selectedItem.name} Instances
                          </div>
                          <div className="mt-1 truncate text-[12px] text-foreground">
                            {selectedTypeName || config.baseTypeFallback}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveBlade("types")}
                            className="flex h-8 items-center gap-2 border border-border px-2 text-[10px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                            title="Back to instrument types"
                          >
                            <X size={13} />
                            Back to Types
                          </button>
                          <button
                            onClick={openAddModal}
                            className="flex h-8 items-center gap-2 border border-primary/30 bg-primary px-4 text-[11px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="flex h-8 min-w-[200px] flex-1 items-center gap-2 border border-border bg-background px-2">
                          <Search size={12} className="shrink-0 text-muted-foreground" />
                          <input
                            value={instanceSearch}
                            onChange={(e) => setInstanceSearch(e.target.value)}
                            placeholder="Search instances..."
                            className="min-w-0 flex-1 bg-transparent text-[11px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                          />
                        </div>
                        {[
                          { id: "all", label: "All" },
                          { id: "active", label: "Active" },
                          { id: "error", label: "Error" },
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setStatusFilter(filter.id as "all" | "active" | "error")}
                            className={`h-8 border px-2 text-[10px] font-mono font-semibold transition-colors ${statusFilter === filter.id
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                              }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sticky top-10 z-10 grid grid-cols-[2fr_1fr_0.7fr_40px] gap-2 border-b border-border bg-muted/5 px-4 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Name</span>
                      <span>Type</span>
                      <span>Status</span>
                      <span></span>
                    </div>

                    <div className="min-h-0 flex flex-1 flex-col overflow-y-auto">
                      {resourcesLoading ? (
                        <div className="px-4 py-8 text-center text-[13px] font-mono text-muted-foreground">
                          Loading resources...
                        </div>
                      ) : resourcesError ? (
                        <div className="px-4 py-8 text-center text-[13px] font-mono text-destructive">
                          Unable to load resources.
                        </div>
                      ) : matchingResources.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[13px] font-mono text-muted-foreground">
                          {config.noInstancesMessage}
                        </div>
                      ) : filteredResources.length === 0 ? (
                        <div className="px-4 py-8 text-center text-[13px] font-mono text-muted-foreground">
                          No resources match the current filters.
                        </div>
                      ) : (
                        <>
                          {filteredResources.map((resource) => {
                            const isSelected = resource.id === selectedResourceId;
                            const hasError = resource.status === "Error";
                            const displayName =
                              config.getDisplayName(resource) ||
                              `Unnamed ${config.itemLabelCapitalized}`;

                            return (
                              <div
                                key={resource.id}
                                role="button"
                                tabIndex={0}
                                title={displayName}
                                onClick={() => selectResource(resource)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    selectResource(resource);
                                  }
                                }}
                                className={`grid cursor-pointer grid-cols-[2fr_1fr_0.7fr_40px] items-center gap-2 border-b border-border/70 px-4 py-1.5 transition-colors ${isSelected
                                  ? "bg-primary/8 shadow-[inset_2px_0_0_0_var(--color-primary)]"
                                  : "hover:bg-secondary/30"
                                  }`}
                              >
                                <div className="truncate text-[12px] font-semibold text-foreground">{displayName}</div>
                                <div className="truncate text-[10px] font-mono text-muted-foreground">
                                  {extractTypeName(String(resource.type ?? "")) || resource.type}
                                </div>
                                <div>
                                  <span
                                    className={`inline-flex min-w-[64px] justify-center border px-2 py-0.5 text-[10px] font-mono font-semibold ${hasError
                                      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                      }`}
                                  >
                                    {resource.status}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();

                            <div className="flex flex-1 border-t border-border bg-muted/5 px-4 py-4">
                              {selectedResource ? (
                                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
                                  <div className="border border-border bg-background p-4">
                                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                      Selected Instance
                                    </div>
                                    <div className="mt-2 text-[16px] font-semibold text-foreground">
                                      {config.getDisplayName(selectedResource) || selectedResource.name}
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] font-mono text-muted-foreground md:grid-cols-2">
                                      <div className="border border-border bg-muted/10 px-2.5 py-2">
                                        <div className="text-[10px] uppercase tracking-wider">Type</div>
                                        <div className="mt-1 truncate text-[12px] text-foreground">
                                          {extractTypeName(String(selectedResource.type ?? "")) || selectedResource.type}
                                        </div>
                                      </div>
                                      <div className="border border-border bg-muted/10 px-2.5 py-2">
                                        <div className="text-[10px] uppercase tracking-wider">Status</div>
                                        <div className="mt-1 text-[12px] text-foreground">{selectedResource.status}</div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col justify-between border border-border bg-background p-4">
                                    <div>
                                      <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                        Next Action
                                      </div>
                                      <div className="mt-2 text-[12px] font-mono text-muted-foreground">
                                        Open configuration blade to edit properties and save changes.
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => setActiveBlade("editor")}
                                      className="mt-4 flex h-9 items-center justify-center gap-2 border border-primary/30 bg-primary px-3 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                      <SlidersHorizontal size={12} />
                                      Open Configuration
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex w-full items-center justify-center border border-dashed border-border bg-background px-6 text-center">
                                  <div>
                                    <div className="text-[14px] font-semibold text-foreground">No instance selected</div>
                                    <div className="mt-2 text-[12px] font-mono text-muted-foreground">
                                      Select a resource row above to view details and configure it.
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                                    requestDelete(resource);
                                  }}
                                  disabled={deleteResourceLoading}
                                  className="ml-auto flex h-7 w-7 items-center justify-center border border-transparent text-destructive transition-colors hover:border-destructive/30 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <DeleteIcon size={13} />
                                </button>
                              </div>
                            );
                          })}

                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeBlade === "editor" && selectedItem && (
                <aside className="blade-enter flex h-full min-w-0 flex-1 flex-col bg-card">
                  <div className="sticky top-0 z-20 flex h-10 items-center justify-between border-b border-border bg-card px-4">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-primary shrink-0" />
                      <span className="text-[13px] font-semibold text-foreground">
                        {selectedResource
                          ? `Edit ${selectedResource.name}`
                          : `New ${config.itemLabelCapitalized}`}
                      </span>
                    </div>
                    <button
                      onClick={closeEditorModal}
                      className="flex h-8 items-center gap-2 border border-border px-2 text-[10px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      title="Back to resource instances"
                    >
                      <X size={13} />
                      Back to Instances
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto space-y-2.5 p-3.5">
                    <section className="border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setShowBasicsPanel((prev) => !prev)}
                        className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border bg-background px-4 py-3 text-left"
                      >
                        <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                          Basic Details
                        </span>
                        <span className="text-[12px] font-mono text-muted-foreground">
                          {showBasicsPanel ? "Hide" : "Show"}
                        </span>
                      </button>

                      {showBasicsPanel && (
                        <div className="p-4">
                          <label className={labelCls}>Resource Name</label>
                          <input
                            ref={config.useNameInputRef ? resourceNameInputRef : undefined}
                            value={resourceName}
                            onChange={(e) => setResourceName(e.target.value)}
                            placeholder="Resource name"
                            title={resourceName}
                            autoFocus
                            className="h-10 w-full truncate border border-border bg-background px-3 text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                          />
                        </div>
                      )}
                    </section>

                    <section className="border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setShowConfigPanel((prev) => !prev)}
                        className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border bg-background px-4 py-3 text-left"
                      >
                        <span className="text-[12px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                          Configuration
                        </span>
                        <span className="text-[12px] font-mono text-muted-foreground">
                          {showConfigPanel ? "Hide" : "Show"}
                        </span>
                      </button>

                      {showConfigPanel && (
                        <div className="p-4">
                          <div className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                            {selectedResource ? `Properties - ${selectedResource.name}` : "Default Parameters"}
                          </div>

                          {schemaLoading ? (
                            <div className="py-6 text-center text-[13px] font-mono text-muted-foreground">
                              Loading parameters...
                            </div>
                          ) : schemaError ? (
                            <div className="py-6 text-center text-[13px] font-mono text-destructive">
                              Unable to load parameters for this {config.itemLabelSingular}.
                            </div>
                          ) : editableProperties.length === 0 ? (
                            <div className="py-6 text-center text-[13px] font-mono text-muted-foreground">
                              No configurable parameters.
                            </div>
                          ) : (
                            <div className="-mx-1">
                              {editableProperties.map((property) =>
                                renderEditor(
                                  toEditorProp(property),
                                  schemaPropertyValues,
                                  setSchemaPropertyValues,
                                  emptyEditorContext,
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    {saveResourceError && (
                      <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] font-mono text-destructive">
                        {saveResourceError}
                      </div>
                    )}

                    {deleteResourceError && (
                      <div className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] font-mono text-destructive">
                        {deleteResourceError}
                      </div>
                    )}
                  </div>

                  <div className="flex h-10 items-center justify-end gap-2 border-t border-border bg-card px-3">
                    <button
                      onClick={closeEditorModal}
                      className="h-8 border border-border px-4 text-[12px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={
                        !resourceName.trim() ||
                        schemaLoading ||
                        schemaError ||
                        saveResourceLoading ||
                        deleteResourceLoading
                      }
                      className="flex h-8 items-center gap-2 bg-primary px-4 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Zap size={12} />
                      {saveResourceLoading
                        ? selectedResource
                          ? "Updating..."
                          : "Adding..."
                        : selectedResource
                          ? `Update ${config.itemLabelCapitalized}`
                          : `Add ${config.itemLabelCapitalized}`}
                    </button>
                  </div>
                </aside>
              )}
            </div>
          </section>
        </div>

        <div className="flex h-10 items-center border-t border-border bg-card px-4">
          <span className="text-[12px] font-mono text-muted-foreground">
            {activeBlade === "types"
              ? `Choose a ${config.itemLabelSingular} type to continue.`
              : activeBlade === "resources"
                ? "Select an existing instance to edit it, or add a new one."
                : `Configure and save the ${config.itemLabelSingular} resource.`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={closePanel}
              className="h-8 border border-border px-4 text-[12px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ─── Delete confirmation popup ───────────────────────────────── */}
      {resourcePendingDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-[1px]"
          onClick={cancelDelete}
        >
          <div
            className="w-[420px] max-w-[92vw] border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-11 items-center justify-between border-b border-border bg-muted/30 px-4">
              <span className="text-[14px] font-semibold text-foreground">
                Confirm Delete
              </span>
              <button
                onClick={cancelDelete}
                className="text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-5 py-5">
              <p className="text-[14px] text-foreground">
                Are you sure you want to delete{" "}
                <span className="font-mono font-semibold">
                  {config.getDisplayName(resourcePendingDelete) || resourcePendingDelete.name}
                </span>
                ?
              </p>
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                This action cannot be undone.
              </p>

              {deleteResourceError && (
                <div className="mt-3 border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] font-mono text-destructive">
                  {deleteResourceError}
                </div>
              )}
            </div>

            <div className="flex h-12 items-center justify-end gap-2 border-t border-border bg-muted/20 px-4">
              <button
                onClick={cancelDelete}
                disabled={deleteResourceLoading}
                className="h-8 border border-border px-4 text-[13px] font-mono font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteResourceLoading}
                className="flex h-8 items-center gap-2 bg-destructive px-4 text-[13px] font-mono font-semibold text-destructive-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DeleteIcon size={12} />
                {deleteResourceLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  return (
    <GenericResourcePanel
      config={CONFIGS.instrument}
      items={instruments}
      search={search}
      setSearch={setSearch}
      isLoading={isLoading}
      isError={isError}
      onClose={onClose}
    />
  );
}

interface DutsPanelProps {
  duts: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

export function DutsPanel({
  duts,
  search,
  setSearch,
  isLoading,
  isError,
  onClose,
}: DutsPanelProps) {
  return (
    <GenericResourcePanel
      config={CONFIGS.duts}
      items={duts}
      search={search}
      setSearch={setSearch}
      isLoading={isLoading}
      isError={isError}
      onClose={onClose}
    />
  );
}

interface ConnectionsPanelProps {
  connections: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

export function ConnectionsPanel({
  connections,
  search,
  setSearch,
  isLoading,
  isError,
  onClose,
}: ConnectionsPanelProps) {
  return (
    <GenericResourcePanel
      config={CONFIGS.connections}
      items={connections}
      search={search}
      setSearch={setSearch}
      isLoading={isLoading}
      isError={isError}
      onClose={onClose}
    />
  );
}