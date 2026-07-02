import { useEffect, useMemo, useState } from "react";
import {
    Cable,
    CheckCircle2,
    DatabaseZap,
    Search,
    X,
    XCircle,
    Zap,
} from "lucide-react";
import {
    getResourceSchema,
    extractTypeName,
    type Resource,
    type ResourceSchemaProperty,
} from "../../api/resources"; 
import { getConnections } from "../../api/plugin";
import { renderEditor, type EditorContext } from "./PropertyEditors";

interface ConnectionsPanelProps {
    connections: any[];
    search: string;
    setSearch: (value: string) => void;
    isLoading: boolean;
    isError: boolean;
    onClose: () => void;
}

const labelCls =
    "block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

const getConnectionIcon = () => (
    <Cable size={15} className="text-primary shrink-0" />
);

const getDefaultName = (connection: any) =>
    connection?.name ? `${connection.name} 1` : "";


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

export function ConnectionsPanel({
    connections,
    search,
    setSearch,
    isLoading,
    isError,
    onClose,
}: ConnectionsPanelProps) {
    const [selectedKey, setSelectedKey] = useState("");
    const [connectionName, setConnectionName] = useState("");

    // ─── Schema state (property definitions for the selected connection type) ─
    const [schemaProperties, setSchemaProperties] = useState<ResourceSchemaProperty[]>([]);
    const [schemaPropertyValues, setSchemaPropertyValues] = useState<Record<string, any>>({});
    const [schemaLoading, setSchemaLoading] = useState(false);
    const [schemaError, setSchemaError] = useState(false);

    // ─── Resource (existing connection instance) state ─────────────────────────
    const [resources, setResources] = useState<Resource[]>([]);
    const [resourcesLoading, setResourcesLoading] = useState(false);
    const [resourcesError, setResourcesError] = useState(false);
    const [selectedResourceId, setSelectedResourceId] = useState<string>("");

    const selectedConnection = useMemo(
        () =>
            connections.find(
                (connection) => `${connection.name}:${connection.assembly}` === selectedKey,
            ) ?? connections[0],
        [connections, selectedKey],
    );

    useEffect(() => {
        if (!selectedConnection) {
            setSelectedKey("");
            setConnectionName("");
            return;
        }

        const key = `${selectedConnection.name}:${selectedConnection.assembly}`;
        if (selectedKey !== key) setSelectedKey(key);
        setConnectionName(getDefaultName(selectedConnection));
        setSelectedResourceId(""); // reset resource selection when switching type
    }, [selectedConnection?.name, selectedConnection?.assembly]);


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

    // ─── Fetch schema whenever the selected connection type changes ──────────
    useEffect(() => {
        if (!selectedConnection?.name) {
            setSchemaProperties([]);
            setSchemaPropertyValues({});
            return;
        }

        let cancelled = false;
        setSchemaLoading(true);
        setSchemaError(false);

        getResourceSchema(selectedConnection.name, "Connection")
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
    }, [selectedConnection?.name]);

    // ─── Fetch all existing connection resources once ─────────────────────────
    useEffect(() => {
        let cancelled = false;
        setResourcesLoading(true);
        setResourcesError(false);

        getConnections()
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

    // ─── Resources that match the currently selected connection type ─────────
    const matchingResources = useMemo(() => {
        if (!selectedConnection?.name) return [];
        return resources.filter(
            (resource) => extractTypeName(resource.type) === selectedConnection.name,
        );
    }, [resources, selectedConnection?.name]);

    const selectedResource = useMemo(
        () => matchingResources.find((r) => r.id === selectedResourceId) ?? null,
        [matchingResources, selectedResourceId],
    );

    const closePanel = () => {
        onClose();
        setSearch("");
    };

    const selectConnection = (connection: any) => {
        setSelectedKey(`${connection.name}:${connection.assembly}`);
        setConnectionName(getDefaultName(connection));
    };

    // ─── Clicking a resource card loads its live values into the editors ─────
    const selectResource = (resource: Resource) => {
        // Clicking the already-selected resource deselects it and blanks the form
        if (resource.id === selectedResourceId) {
            setSelectedResourceId("");
            setConnectionName(getDefaultName(selectedConnection));
            const blankValues: Record<string, any> = {};
            schemaProperties.forEach((property) => {
                blankValues[property.name] = getBlankValue(property);
            });
            setSchemaPropertyValues(blankValues);
            return;
        }

        setSelectedResourceId(resource.id);
        setConnectionName(resource.name);

        setSchemaPropertyValues((prev) => {
            const next = { ...prev };
            schemaProperties.forEach((property) => {
                if (resource.properties && property.name in resource.properties) {
                    next[property.name] = resource.properties[property.name] ?? getBlankValue(property);
                } else {
                    next[property.name] = getBlankValue(property);
                }
            });
            return next;
        });
    };

    const editableProperties = schemaProperties.filter((p) => p.isEditable);

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
                            Add Connection
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
                                    Loading connections...
                                </div>
                            ) : isError ? (
                                <div className="px-4 py-8 text-center text-[12px] font-mono text-destructive">
                                    Unable to load connections.
                                </div>
                            ) : connections.length === 0 ? (
                                <div className="px-4 py-8 text-center text-[12px] font-mono text-muted-foreground">
                                    {search ? "No matching connections." : "No connections available."}
                                </div>
                            ) : (
                                connections.map((connection) => {
                                    const key = `${connection.name}:${connection.assembly}`;
                                    const isSelected = key === selectedKey;

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => selectConnection(connection)}
                                            className={`flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors ${isSelected
                                                ? "bg-secondary text-foreground"
                                                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                                                }`}
                                        >
                                            {getConnectionIcon()}
                                            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                                                {connection.name}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    <section className="flex min-w-0 flex-1 flex-col bg-card">
                        <div className="border-b border-border px-5 py-4">
                            {selectedConnection ? (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{getConnectionIcon()}</div>
                                    <div className="min-w-0">
                                        <div className="truncate text-[13px] font-semibold text-foreground">
                                            {selectedConnection.name}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                                            {selectedConnection.baseType || "Connection interface"}
                                        </div>
                                        {selectedConnection.assembly && (
                                            <div className="mt-1 truncate text-[10px] font-mono text-muted-foreground/70">
                                                {selectedConnection.assembly}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-[12px] font-mono text-muted-foreground">
                                    Select a connection type.
                                </div>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                            <div className="space-y-5">
                                {/* ─── Existing resource cards for this connection type ─── */}
                                {selectedConnection && (
                                    <div>
                                        <div className="mb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                            Existing {selectedConnection.name} Instances
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
                                                No existing instances of this connection.
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {matchingResources.map((resource) => {
                                                    const isSelected = resource.id === selectedResourceId;
                                                    const hasError = resource.status === "Error";

                                                    return (
                                                        <button
                                                            key={resource.id}
                                                            onClick={() => selectResource(resource)}
                                                            className={`flex items-center gap-2 border px-3 py-2 text-left transition-colors ${isSelected
                                                                ? "border-primary bg-secondary"
                                                                : "border-border bg-background hover:bg-secondary/60"
                                                                }`}
                                                        >
                                                            {hasError ? (
                                                                <XCircle size={13} className="shrink-0 text-destructive" />
                                                            ) : (
                                                                <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="truncate text-[12px] font-mono font-semibold text-foreground">
                                                                    {resource.name}
                                                                </div>
                                                                <div
                                                                    className={`text-[10px] font-mono ${hasError ? "text-destructive" : "text-muted-foreground"
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

                                <div>
                                    <label className={labelCls}>Connection Name</label>
                                    <input
                                        value={connectionName}
                                        onChange={(e) => setConnectionName(e.target.value)}
                                        placeholder="Connection name"
                                        className="h-9 w-full bg-background border border-border px-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                                        disabled={!selectedConnection}
                                    />
                                </div>

                                <div>
                                    <div className="mb-3 border-t border-border pt-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                                        {selectedResource ? `Properties — ${selectedResource.name}` : "Default Parameters"}
                                    </div>

                                    {!selectedConnection ? null : schemaLoading ? (
                                        <div className="py-6 text-center text-[12px] font-mono text-muted-foreground">
                                            Loading parameters...
                                        </div>
                                    ) : schemaError ? (
                                        <div className="py-6 text-center text-[12px] font-mono text-destructive">
                                            Unable to load parameters for this connection.
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
                    </section>
                </div>

                <div className="flex h-12 items-center border-t border-border bg-muted/20 px-4">
                    <span className="text-[11px] font-mono text-muted-foreground">
                        Will be added to the Connections panel
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={closePanel}
                            className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={closePanel}
                            disabled={!selectedConnection || !connectionName.trim()}
                            className="flex h-8 items-center gap-2 bg-primary px-4 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Zap size={12} />
                            Add Connection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}