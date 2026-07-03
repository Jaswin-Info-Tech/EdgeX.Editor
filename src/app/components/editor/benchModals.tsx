import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Cable,
  CheckCircle2,
  Cpu,
  DatabaseZap,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
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

/* ────────────────────────────────────────────────────────────────────────
 * Shared helpers (identical across the original three panels)
 * ──────────────────────────────────────────────────────────────────────── */

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

// Only needed by the Connections flavor: some backends send a numeric index
// (or numeric-looking string) instead of the enum label itself.
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

/* ────────────────────────────────────────────────────────────────────────
 * Per-kind configuration — this is the only thing that differs between
 * Instruments / DUTs / Connections. Everything else is shared logic below.
 * ──────────────────────────────────────────────────────────────────────── */

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
  /** Resolve the pluginTypeName / schema key used to fetch schema + save. */
  resolveTypeName: (item: any) => string;
  /** Predicate to decide whether a Resource belongs to the selected item. */
  matchesResource: (resource: Resource, item: any, typeName: string) => boolean;
  /** Display name shown on a resource "chip". */
  getDisplayName: (resource: Resource) => string;
  /** Whether to coerce enum values coming back from the API (Connections only). */
  coerceEnums?: boolean;
  /** Whether the name input uses an uncontrolled ref fallback on save. */
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
    deleteIcon: (p) => <XCircle {...p} />,
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

/* ────────────────────────────────────────────────────────────────────────
 * Generic panel — implements the shared behavior for all three kinds
 * ──────────────────────────────────────────────────────────────────────── */

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

  // ─── Nested add/edit modal visibility ─────────────────────────────────
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // ─── Schema state (property definitions for the selected item type) ──────
  const [schemaProperties, setSchemaProperties] = useState<ResourceSchemaProperty[]>([]);
  const [schemaPropertyValues, setSchemaPropertyValues] = useState<Record<string, any>>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState(false);

  // ─── Resource (existing instance) state ───────────────────────────────────
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [saveResourceLoading, setSaveResourceLoading] = useState(false);
  const [saveResourceError, setSaveResourceError] = useState("");
  const [deleteResourceLoading, setDeleteResourceLoading] = useState(false);
  const [deleteResourceError, setDeleteResourceError] = useState("");

  const selectedItem = useMemo(
    () =>
      items.find((item) => `${item.name}:${item.assembly}` === selectedKey) ??
      items[0],
    [items, selectedKey],
  );

  const selectedTypeName = useMemo(
    () => config.resolveTypeName(selectedItem),
    [config, selectedItem],
  );

  useEffect(() => {
    if (!selectedItem) {
      setSelectedKey("");
      setResourceName("");
      return;
    }

    const key = `${selectedItem.name}:${selectedItem.assembly}`;
    if (selectedKey !== key) setSelectedKey(key);
    setResourceName("");
    setSelectedResourceId(""); // reset resource selection when switching type
    setSaveResourceError("");
    setDeleteResourceError("");
    setIsEditorOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.name, selectedItem?.assembly]);

  // ─── Fetch schema whenever the selected item type changes ────────────────
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

  const selectedResource = useMemo(
    () => matchingResources.find((r) => r.id === selectedResourceId) ?? null,
    [matchingResources, selectedResourceId],
  );

  const closePanel = () => {
    onClose();
    setSearch("");
  };

  const selectItem = (item: any) => {
    setSelectedKey(`${item.name}:${item.assembly}`);
    setResourceName("");
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
    setSaveResourceError("");
    setDeleteResourceError("");
    setIsEditorOpen(true);
  };

  // ─── Clicking a resource card loads its live values and opens the editor ─
  const selectResource = (resource: Resource) => {
    setSelectedResourceId(resource.id);
    setResourceName(resource.name);
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

    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    setSaveResourceError("");
    setDeleteResourceError("");
  };

  const editableProperties = schemaProperties.filter((p) => p.isEditable);

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
      setIsEditorOpen(false);
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

  const handleDelete = async () => {
    if (!selectedResource) return;

    setDeleteResourceLoading(true);
    setDeleteResourceError("");
    setSaveResourceError("");
    const toastId = toast.loading(`Deleting ${selectedResource.name}...`);

    try {
      await deleteResource({
        resourceKind: config.resourceKind,
        name: selectedResource.name,
      });

      const updatedResources = await getResources();
      setResources(updatedResources);
      resetToBlank();
      setIsEditorOpen(false);
      toast.success(`${selectedResource.name} deleted successfully`, { id: toastId });
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
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      onClick={closePanel}
    >
      <div
        className="bg-card border border-border w-[720px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 items-center justify-between border-b border-border bg-muted/30 px-4">
          <div className="flex items-center gap-2">
            <DatabaseZap size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">
              {config.panelTitle}
            </span>
          </div>
          <button
            onClick={closePanel}
            className="text-muted-foreground hover:text-foreground"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[210px] shrink-0 flex-col border-r border-border bg-muted/10">
            <div className="border-b border-border p-3">
              <div className="flex h-8 items-center gap-2 border border-border bg-background px-2">
                <Search size={12} className="shrink-0 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
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

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  {config.loadingItemsMessage}
                </div>
              ) : isError ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-destructive">
                  {config.errorItemsMessage}
                </div>
              ) : items.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-muted-foreground">
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
                      className={`flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors ${isSelected
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                        }`}
                    >
                      <Icon size={15} className="text-primary shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                        {item.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-card">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!selectedItem ? (
                <div className="py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Select a{/^[aeiou]/i.test(config.itemLabelSingular) ? "n" : ""}{" "}
                  {config.itemLabelSingular} type.
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className="truncate text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground"
                      title={`Existing ${selectedItem.name} Instances`}
                    >
                      Existing {selectedItem.name} Instances
                    </div>
                    <button
                      onClick={openAddModal}
                      className="flex h-7 items-center gap-1.5 bg-primary px-3 text-[11px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Plus size={12} />
                      Add New
                    </button>
                  </div>

                  {resourcesLoading ? (
                    <div className="py-3 text-[11px] font-mono text-muted-foreground">
                      Loading resources...
                    </div>
                  ) : resourcesError ? (
                    <div className="py-3 text-[11px] font-mono text-destructive">
                      Unable to load resources.
                    </div>
                  ) : matchingResources.length === 0 ? (
                    <div className="py-3 text-[11px] font-mono text-muted-foreground">
                      {config.noInstancesMessage}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {matchingResources.map((resource) => {
                        const isSelected = resource.id === selectedResourceId;
                        const hasError = resource.status === "Error";
                        const displayName =
                          config.getDisplayName(resource) ||
                          `Unnamed ${config.itemLabelCapitalized}`;

                        return (
                          <button
                            key={resource.id}
                            title={displayName}
                            onClick={() => selectResource(resource)}
                            className={`flex h-24 w-full items-center gap-3 border px-5 py-5 text-left transition-colors ${isSelected
                              ? "border-primary bg-secondary"
                              : "border-border bg-background hover:bg-secondary/60"
                              }`}
                          >
                            {hasError ? (
                              <XCircle size={22} className="shrink-0 text-destructive" />
                            ) : (
                              <CheckCircle2 size={22} className="shrink-0 text-emerald-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[14px] font-mono font-semibold text-foreground">
                                {displayName}
                              </div>
                              <div
                                className={`mt-1 text-[12px] font-mono ${hasError ? "text-destructive" : "text-muted-foreground"
                                  }`}
                              >
                                {resource.status}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex h-12 items-center border-t border-border bg-muted/20 px-4">
          <span className="text-[11px] font-mono text-muted-foreground">
            Select an existing instance to edit it, or add a new one.
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={closePanel}
              className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ─── Nested Add / Edit modal ─────────────────────────────────── */}
      {isEditorOpen && selectedItem && (
        <div
          className="fixed inset-0 bg-black-700/75 flex items-center justify-center z-[60]"
          onClick={closeEditorModal}
        >
          <div
            className="bg-card border border-border w-[720px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-11 items-center justify-between border-b border-border bg-muted/30 px-4">
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-primary shrink-0" />
                <span className="text-[13px] font-semibold text-foreground">
                  {selectedResource
                    ? `Edit ${selectedResource.name}`
                    : `New ${config.itemLabelCapitalized}`}
                </span>
              </div>
              <button
                onClick={closeEditorModal}
                className="text-muted-foreground hover:text-foreground"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Resource Name</label>
                  <input
                    ref={config.useNameInputRef ? resourceNameInputRef : undefined}
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    placeholder="Resource name"
                    title={resourceName}
                    autoFocus
                    className="h-9 w-full truncate bg-background border border-border px-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <div className="mb-3 border-t border-border pt-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedResource ? `Properties — ${selectedResource.name}` : "Default Parameters"}
                  </div>

                  {saveResourceError && (
                    <div className="mb-3 border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] font-mono text-destructive">
                      {saveResourceError}
                    </div>
                  )}

                  {deleteResourceError && (
                    <div className="mb-3 border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] font-mono text-destructive">
                      {deleteResourceError}
                    </div>
                  )}

                  {schemaLoading ? (
                    <div className="py-6 text-center text-[12px] font-mono text-muted-foreground">
                      Loading parameters...
                    </div>
                  ) : schemaError ? (
                    <div className="py-6 text-center text-[12px] font-mono text-destructive">
                      Unable to load parameters for this {config.itemLabelSingular}.
                    </div>
                  ) : editableProperties.length === 0 ? (
                    <div className="py-6 text-center text-[12px] font-mono text-muted-foreground">
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
              </div>
            </div>

            <div className="flex h-12 items-center border-t border-border bg-muted/20 px-4">
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedResource ? config.footerUpdatedMessage : config.footerAddedMessage}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {selectedResource && (
                  <button
                    onClick={handleDelete}
                    disabled={deleteResourceLoading || saveResourceLoading}
                    className="flex h-8 items-center gap-2 border border-destructive/50 px-4 text-[12px] font-mono font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <DeleteIcon size={12} />
                    {deleteResourceLoading ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button
                  onClick={closeEditorModal}
                  className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    !resourceName.trim() ||
                    schemaLoading ||
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
 * Public components — same names/props as the original three files, so
 * existing imports (e.g. `import { InstrumentsPanel } from ".../InstrumentsPanel"`)
 * keep working if you just re-point them at this file.
 * ──────────────────────────────────────────────────────────────────────── */

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