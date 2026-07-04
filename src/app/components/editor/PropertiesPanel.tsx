import { AlertTriangle, ChevronDown, ChevronRight, Plug, Search, Sliders } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { TYPE_STRIPE } from "../../constants/editor";
import { flatAll, formatFreq, updateIn } from "../../utils/editor";
import { StatusPill, Toggle, TypeIcon } from "./atoms";
import { fetchStepSchema, lockResolvedTypeName } from "../../store/slices/propertiesSlice"; // 👈 update path to match your file
import {
  EditorContext,
  getSchemaRecords,
  inputCls,
  normalizeEditorType,
  renderEditor,
  toBackendRecordOption,
} from "./PropertyEditors";

// ─── PropertiesPanel ──────────────────────────────────────────────────────────
interface PropertiesPanelProps {
  selectedStep: any;
  selectedId: any;
  plan: any[];
  instruments: any[];
  resources?: any[];
  testSteps: any[];
  setPlan: any;
  setSelectedId: any;
  setAddStepParentId: any;
  setShowAddStep: any;
  updateProperty: any;
}

export function PropertiesPanel({
  selectedStep,
  selectedId,
  plan,
  instruments,
  resources = [],
  testSteps,
  setPlan,
  updateProperty,
}: PropertiesPanelProps) {
  const dispatch = useAppDispatch();
  const [schemaPropertyValues, setSchemaPropertyValues] = useState<Record<string, any>>({});
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [schemaSavedSnapshot, setSchemaSavedSnapshot] = useState("{}");
  // console.log("PropertiesPanel selectedStep:", selectedStep);
  // console.log("PropertiesPanel resources:", resources);
  // Reads from the `properties` slice
  const resolvedTypeNames = useAppSelector((state: any) => state.properties.resolvedTypeNames);
  const schemaCache = useAppSelector((state: any) => state.properties.cache);
  const errorsByTypeName = useAppSelector((state: any) => state.properties.errorsByTypeName);

  const getSchemaPropertyKey = (prop: any) => `${prop.name || prop.displayName} || ${prop.name}`;

  const isObjectLikeEditor = (prop: any) => {
    const type = normalizeEditorType(prop.editorType);
    return type === "object" || type === "json";
  };

  // helper: is this resource a DUT or connection? (exclude from instrument dropdown)
const isConnectionOrDut = (type: string = "") =>
  /connection/i.test(type) || /dut/i.test(type);

  // helper: classify a resource's "family" from its backend type string
  const getInstrumentFamily = (type: string = "") => {
    if (/rest/i.test(type)) return "rest";
    if (/scpi/i.test(type)) return "scpi";
    return "other";
  };

  const getResourceFamily = (resource: any) =>
    getInstrumentFamily(
      [resource?.type, resource?.instrument, resource?.name]
        .filter(Boolean)
        .join(" "),
    );

  const stepTypeName = useMemo(() => {
    if (!selectedStep) return null;
    const locked = resolvedTypeNames[selectedStep.id];
    if (locked) return locked;
    return (
      selectedStep.stepTypeName ??
      selectedStep.typeName ??
      selectedStep.fullName ??
      selectedStep.className ??
      selectedStep.name
    );
  }, [selectedStep?.id, resolvedTypeNames]);

  // derive which family the *selected step* expects, from its resolved type name
  const stepInstrumentFamily = useMemo(() => {
    const name = String(stepTypeName || selectedStep?.name || "");
    if (/rest/i.test(name)) return "rest";
    if (/scpi/i.test(name)) return "scpi";
    return null; // unknown -> don't filter by family
  }, [stepTypeName, selectedStep?.name]);

const editorContext = useMemo<EditorContext>(() => {
  const instrumentOptions = (resources ?? [])
    .filter((r: any) => r?.name)
    .filter((r: any) => !isConnectionOrDut(r.type || r.instrument))
    .filter((r: any) =>
      !stepInstrumentFamily ||
      getInstrumentFamily(r.type || r.instrument) === stepInstrumentFamily
    )
    .map((r: any) => ({
      label: r.name,
      value: r.name,
      description: [r?.instrument, r?.status].filter(Boolean).join(" | "),
    }));

  // console.log("computed instrumentOptions:", instrumentOptions); // 👈 temp debug

  return {
    instrumentOptions,
    resourceOptions: (resources ?? [])
      .filter((resource: any) => resource?.name)
      .map((resource: any) => ({
        label: String(resource.name),
        value: String(resource.name),
        description: [resource?.instrument, resource?.status].filter(Boolean).join(" | "),
      })),
    testStepOptions: testSteps
      .filter((step: any) => step?.canCreateInstance !== false && step?.isBrowsable !== false)
      .filter((step: any) => step?.name)
      .map(toBackendRecordOption),
    planStepOptions: flatAll(plan || [])
      .filter((step: any) => step.id !== selectedStep?.id)
      .map((step: any) => ({
        label: step.name,
        value: step.id,
        description: step.type,
      })),
  };
}, [resources, testSteps, plan, selectedStep?.id, stepInstrumentFamily]);





  useEffect(() => {
    if (!selectedStep || !stepTypeName) return;
    if (!resolvedTypeNames[selectedStep.id]) {
      dispatch(lockResolvedTypeName({ stepId: selectedStep.id, stepTypeName }));
    }
  }, [selectedStep?.id, stepTypeName, resolvedTypeNames, dispatch]);


  useEffect(() => {
    if (!stepTypeName) return;
    dispatch(fetchStepSchema(stepTypeName));
  }, [stepTypeName, dispatch]);

  const schemaResponse = stepTypeName ? schemaCache[stepTypeName] : null;
  const schemaError = stepTypeName ? errorsByTypeName[stepTypeName] : null;

  const makeSchemaSnapshot = useCallback((values: Record<string, any>, props: any[]) => {
    const payload = props
      .map((prop: any) => ({
        name: String(prop?.name ?? ""),
        value: values[prop?.name],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    try {
      return JSON.stringify(payload);
    } catch {
      return "[]";
    }
  }, []);

  const schemaRecords = useMemo(() => getSchemaRecords(schemaResponse), [schemaResponse]);
  const schemaProperties = useMemo(() => schemaRecords[0]?.properties ?? [], [schemaRecords]);
  const filteredSchemaProperties = useMemo(() => {
    const query = schemaSearch.trim().toLowerCase();
    if (!query) return schemaProperties;
    return schemaProperties.filter((prop: any) => {
      const name = String(prop.name ?? "").toLowerCase();
      const displayName = String(prop.displayName ?? "").toLowerCase();
      const editorType = String(prop.editorType ?? "").toLowerCase();
      const typeName = String(prop.propertyType ?? prop.fullTypeName ?? "").toLowerCase();
      return (
        name.includes(query) ||
        displayName.includes(query) ||
        editorType.includes(query) ||
        typeName.includes(query)
      );
    });
  }, [schemaProperties, schemaSearch]);

  const incompatibleInstrumentSelections = useMemo(() => {
    if (!stepInstrumentFamily || !selectedStep) return [] as Array<{ propLabel: string; name: string; actualFamily: string }>;

    const instrumentProps = schemaProperties.filter((prop: any) =>
      normalizeEditorType(prop.editorType) === "instrument-selector",
    );

    return instrumentProps.flatMap((prop: any) => {
      const rawValue = schemaPropertyValues[prop.name];
      const selectedName =
        rawValue && typeof rawValue === "object"
          ? String(rawValue.Name ?? "").trim()
          : String(rawValue ?? "").trim();

      if (!selectedName) return [];

      const matchedResource = (resources ?? []).find(
        (resource: any) => String(resource?.name ?? "").trim() === selectedName,
      );

      if (!matchedResource) return [];

      const actualFamily = getResourceFamily(matchedResource);
      if (actualFamily === stepInstrumentFamily) return [];

      return [{
        propLabel: String(prop.displayName ?? prop.name ?? "Instrument"),
        name: selectedName,
        actualFamily,
      }];
    });
  }, [resources, schemaProperties, schemaPropertyValues, selectedStep, stepInstrumentFamily]);

  const noCompatibleInstrumentOptions =
    Boolean(stepInstrumentFamily) &&
    schemaProperties.some((prop: any) => normalizeEditorType(prop.editorType) === "instrument-selector") &&
    editorContext.instrumentOptions.length === 0;

  useEffect(() => {
    setSchemaCollapsed(false);
    setSchemaSearch("");
  }, [selectedStep?.id]);

useEffect(() => {
  if (!selectedStep) {
    setSchemaPropertyValues({});
    return;
  }
  const values: Record<string, any> = {};
  schemaProperties.forEach((prop: any) => {
    const key = getSchemaPropertyKey(prop);
    const existing = selectedStep.properties?.find(
      (item: any) => item.key === key,
    );
    const value = existing?.value;

    const isEnabledWrapper =
      prop.propertyType?.includes("OpenTap.Enabled") ||
      prop.fullTypeName?.includes("OpenTap.Enabled");

    const isNameProp =
      String(prop.name || prop.displayName || "").toLowerCase() === "name";

    if (isEnabledWrapper && value && typeof value === "object") {
      values[prop.name] = value.Value ?? "";
    } else if (
      prop.editorType === "instrument-selector" &&
      value &&
      typeof value === "object"
    ) {
      values[prop.name] = value.Name ?? "";
    } else if (prop.name === "CommandType") {
      values[prop.name] = Array.isArray(value) ? value : [];
    } else if (isObjectLikeEditor(prop)) {
      values[prop.name] = value ?? null;
    } else if (isNameProp) {
      // Fall back to the step's real name instead of blanking it out,
      // and self-heal any previously-saved empty value.
      const hasRealValue = value != null && String(value).trim() !== "";
      values[prop.name] = hasRealValue ? value : (selectedStep.name ?? "");
    } else {
      values[prop.name] =
        value ?? (prop.editorType === "checkbox" ? false : "");
    }
  });
  setSchemaPropertyValues(values);
  setSchemaSavedSnapshot(makeSchemaSnapshot(values, schemaProperties));
}, [selectedStep, schemaProperties]);

  const hasUnsavedSchemaChanges = useMemo(() => {
    if (!schemaProperties.length) return false;
    const current = makeSchemaSnapshot(schemaPropertyValues, schemaProperties);
    return current !== schemaSavedSnapshot;
  }, [makeSchemaSnapshot, schemaProperties, schemaPropertyValues, schemaSavedSnapshot]);


  const getTypedValue = (prop: any, value: any) => {
    const type = normalizeEditorType(prop.editorType);
    const isBlank = value == null || (typeof value === "string" && value.trim() === "");

    if (prop.name === "CommandType") {
      return Array.isArray(value) ? value : value ? [value] : [];
    }

    if (prop.name === "MaxCount" && isBlank) {
      return {};
    }

    const isEnabledWrapper =
      prop.propertyType?.includes("OpenTap.Enabled") ||
      prop.fullTypeName?.includes("OpenTap.Enabled");

    if (isEnabledWrapper) {
      if (value == null || String(value).trim() === "") return null;
      return {
        IsEnabled: value !== "" && value != null,
        Value: value ?? "",
      };
    }

    switch (type) {
      case "integer":
        return value === "" ? 0 : parseInt(value, 10);
      case "number":
        return value === "" ? 0 : Number(value);
      case "checkbox":
        return Boolean(value);
      case "multiselect":
        return Array.isArray(value) ? value : value ? [value] : [];
      case "select":
      case "dropdown":
        return value == null || String(value).trim() === "" ? undefined : value;
      case "instrument-selector":
        if (!value) return null;
        return {
          $type:
            prop.propertyType ??
            prop.typeName ??
            prop.fullTypeName ??
            "Keysight.OpenTap.Plugins.ScpiNetInstrument.Ag33210_1_04v4.Ag33210_1_04v4",
          Name: value,
        };
      case "object":
      case "json":
        if (value == null) return null;
        if (typeof value === "string" && value.trim() === "") return null;
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.getPrototypeOf(value) === Object.prototype &&
          Object.keys(value).length === 0
        ) {
          return null;
        }
        return value;
      default:
        return value;
    }
  };

  const commitSchemaProperties = () => {
    if (!selectedStep) return;
    const meta = schemaRecords[0];

    setPlan((prev: any) => updateIn(prev, selectedStep.id, (step: any) => {
      const existingProps = step.properties || [];

      const newProps = schemaProperties
        .map((prop: any) => {
          const key = getSchemaPropertyKey(prop);
          const typedValue = getTypedValue(prop, schemaPropertyValues[prop.name]);
          return {
            key,
            label: prop.name || prop.displayName,
            type: prop.editorType === "checkbox" ? "boolean" : prop.editorType === "number" ? "number" : "string",
            value: typedValue,
            group: "Schema Properties",
          };
        })
        .filter((p: any) => p.value !== undefined);

      const keepProps = existingProps.filter((item: any) => item.group !== "Schema Properties");

      return {
        ...step,
        properties: [...keepProps, ...newProps],
        stepTypeName: meta?.fullName ?? step.stepTypeName,
        assembly: meta?.assembly ?? step.assembly,
        baseType: meta?.baseType ?? step.baseType,
        fullName: meta?.fullName ?? step.fullName,
      };
    }));

    setSchemaSavedSnapshot(makeSchemaSnapshot(schemaPropertyValues, schemaProperties));
  };

  const renderProperties = () => {
    if (!selectedStep)
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <Sliders size={24} className="opacity-20" />
          <span className="text-[12px] font-mono">
            Select a step to inspect
          </span>
        </div>
      );

    const groups: string[] = Array.from(
      new Set(
        (selectedStep.properties || []).map((p: any) => p.group as string),
      ),
    ).filter((group): group is string => group !== "Schema Properties");
    const hasDisplayedProperties = groups.length > 0;
    const hasSchemaProperties = schemaProperties.length > 0;
    const showSchemaSection = hasSchemaProperties || Boolean(schemaError);
    const canSaveSchema = hasSchemaProperties && !schemaError;

    const stripe = TYPE_STRIPE[selectedStep.type] || "#64748b";

    return (
      <div className="flex h-full flex-col bg-card">
        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-border bg-gradient-to-r from-muted/30 via-muted/10 to-card" style={{ borderLeft: `3px solid ${stripe}` }}>
          <div className="px-3 py-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <TypeIcon type={selectedStep.type} size={14} />
              <span className="text-[13px] font-semibold text-foreground font-mono leading-tight">
                {selectedStep.name}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selectedStep.status} />
              <span className="border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {(selectedStep.type || "unknown").toUpperCase()}
              </span>
              {stepInstrumentFamily && (
                <span className="border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                  {stepInstrumentFamily} instrument required
                </span>
              )}
              {selectedStep.description && (
                <span className="text-[11px] text-muted-foreground">
                  · {selectedStep.description}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-muted/10">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Breakpoint
            </span>
            <Toggle
              value={!!selectedStep.breakpoint}
              onChange={() =>
                setPlan((prev: any) =>
                  updateIn(prev, selectedStep.id, (s) => ({
                    ...s,
                    breakpoint: !s.breakpoint,
                  })),
                )
              }
            />
          </div>
        </div>

        {noCompatibleInstrumentOptions && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11px] font-mono text-amber-700 dark:text-amber-300">
            No compatible {stepInstrumentFamily?.toUpperCase()} instruments found in resources.
          </div>
        )}

        {incompatibleInstrumentSelections.length > 0 && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <div className="flex items-start gap-2 text-[11px] font-mono text-amber-700 dark:text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">
                  Instrument-family mismatch detected (expected {stepInstrumentFamily?.toUpperCase()}).
                </div>
                {incompatibleInstrumentSelections.map((item, index) => (
                  <div key={`${item.propLabel}-${item.name}-${index}`} className="mt-1">
                    {item.propLabel}: {item.name} ({item.actualFamily.toUpperCase()})
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {groups.map((group) => (
          <div key={group}>
            <div className="flex items-center gap-2 border-b border-border bg-muted/35 px-3 py-2">
              <div className="w-[3px] h-3" style={{ background: stripe }} />
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                {group}
              </span>
            </div>
            {(selectedStep.properties || [])
              .filter((p: any) => p.group === group)
              .map((prop: any) => {
                const isReadOnly = prop.isEditable === false;
                return (
                  <div
                    key={prop.key}
                    className="border-b border-border/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="block text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                        {prop.label}
                      </label>
                      {isReadOnly && (
                        <span className="ml-auto text-[9px] font-mono text-muted-foreground border border-border px-1.5">
                          read only
                        </span>
                      )}
                    </div>
                    {prop.type === "boolean" ? (
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[12px] font-mono ${isReadOnly ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {prop.value ? "True" : "False"}
                        </span>
                        {isReadOnly ? (
                          <span
                            className={`w-9 h-5 relative border opacity-60 ${prop.value ? "bg-primary border-primary" : "bg-muted border-border"}`}
                          >
                            <span
                              className={`absolute top-0.5 w-3.5 h-3.5 bg-white ${prop.value ? "left-[19px]" : "left-0.5"}`}
                            />
                          </span>
                        ) : (
                          <Toggle
                            value={prop.value as boolean}
                            onChange={() =>
                              updateProperty(
                                selectedStep.id,
                                prop.key,
                                String(!prop.value),
                              )
                            }
                          />
                        )}
                      </div>
                    ) : prop.type === "enum" ? (
                      <select
                        value={String(prop.value)}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          updateProperty(
                            selectedStep.id,
                            prop.key,
                            e.target.value,
                          )
                        }
                        className={inputCls}
                      >
                        {prop.options?.map((o: any) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          key={`${selectedStep.id}-${prop.key}`}
                          defaultValue={
                            prop.type === "frequency"
                              ? formatFreq(prop.value as number)
                              : String(prop.value)
                          }
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                          onBlur={(e) => {
                            if (!isReadOnly)
                              updateProperty(
                                selectedStep.id,
                                prop.key,
                                e.target.value,
                              );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              (e.target as HTMLInputElement).blur();
                          }}
                          className={`flex-1 ${inputCls} min-w-0`}
                        />
                        {prop.unit && prop.type !== "frequency" && (
                          <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                            {prop.unit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}

        {showSchemaSection && (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/35 px-3 py-2">
              <div className="flex items-center gap-2">
              <div className="w-[3px] h-3" style={{ background: stripe }} />
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                  Schema Properties
              </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {hasSchemaProperties
                    ? `${filteredSchemaProperties.length}/${schemaProperties.length} fields`
                    : "No fields"}
                </span>
                <button
                  type="button"
                  onClick={() => setSchemaCollapsed((prev) => !prev)}
                  className="flex h-6 w-6 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  title={schemaCollapsed ? "Expand schema fields" : "Collapse schema fields"}
                >
                  {schemaCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>

            {!schemaCollapsed && hasSchemaProperties && (
              <div className="border-b border-border px-3 py-2 bg-muted/10">
                <div className="flex h-8 items-center gap-2 border border-border bg-background px-2.5 focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/15">
                  <Search size={12} className="shrink-0 text-muted-foreground" />
                  <input
                    value={schemaSearch}
                    onChange={(e) => setSchemaSearch(e.target.value)}
                    placeholder="Filter schema fields..."
                    className="min-w-0 flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>
            )}

            {schemaCollapsed ? (
              <div className="border-b border-border px-3 py-3 text-[11px] font-mono text-muted-foreground">
                Schema fields are collapsed.
              </div>
            ) : hasSchemaProperties ? (
              filteredSchemaProperties.length > 0 ? (
                filteredSchemaProperties.map((prop: any) =>
                  renderEditor(
                    prop,
                    schemaPropertyValues,
                    setSchemaPropertyValues,
                    editorContext,
                  ),
                )
              ) : (
                <div className="border-b border-border px-3 py-3 text-[11px] font-mono text-muted-foreground">
                  No schema fields match your filter.
                </div>
              )
            ) : (
              <div className="border-b border-border px-3 py-4 text-[12px] text-muted-foreground font-mono">
                {schemaError ? (
                  <span className="flex items-start gap-2 text-destructive">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{`Unable to load schema: ${schemaError}`}</span>
                  </span>
                ) : (
                  "No configurable schema properties."
                )}
              </div>
            )}

          </>
        )}

        {!hasDisplayedProperties && !showSchemaSection && (
          <div className="px-3 py-5 text-center text-[12px] font-mono text-muted-foreground">
            No editable properties for this step.
          </div>
        )}

        </div>

        {selectedStep && (
          <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-[1px]">
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-[10px] font-mono ${hasUnsavedSchemaChanges ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                {hasUnsavedSchemaChanges ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>

            <button
              onClick={commitSchemaProperties}
              disabled={!canSaveSchema || !hasUnsavedSchemaChanges}
              className="flex h-9 w-full items-center justify-center gap-1.5 border border-border bg-primary text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plug size={11} />
              Save Properties
            </button>
            {!canSaveSchema && (
              <div className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                Schema must be loaded to save schema properties.
              </div>
            )}
          </div>
        )}


      </div>
    );
  };

  return renderProperties();
}