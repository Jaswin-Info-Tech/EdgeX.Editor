import { Plus, Sliders, Trash2, Plug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, flatAll, formatFreq, updateIn } from "../../utils/editor";
import { StatusPill, Toggle, TypeIcon } from "./atoms";
import { getStepSchema } from "../../api/plugin";
import {
  EditorContext,
  getSchemaRecords,
  inputCls,
  labelCls,
  renderEditor,
  toBackendRecordOption,
} from "./PropertyEditors";

// ─── PropertiesPanel ──────────────────────────────────────────────────────────
interface PropertiesPanelProps {
  selectedStep: any;
  selectedId: any;
  plan: any[];
  instruments: any[];
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
  testSteps,
  setPlan,
  setSelectedId,
  setAddStepParentId,
  setShowAddStep,
  updateProperty,
}: PropertiesPanelProps) {
  const [schemaResponse, setSchemaResponse] = useState<any>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaPropertyValues, setSchemaPropertyValues] = useState<Record<string, any>>({});

  const getSchemaPropertyKey = (prop: any) => `${prop.name || prop.displayName} || ${prop.name}`;
  const schemaRecords = useMemo(() => getSchemaRecords(schemaResponse), [schemaResponse]);
  const schemaProperties = useMemo(() => schemaRecords[0]?.properties ?? [], [schemaRecords]);

  const editorContext = useMemo<EditorContext>(() => ({
    instrumentOptions: instruments
      .filter((instrument: any) => instrument?.canCreateInstance !== false && instrument?.isBrowsable !== false)
      .filter((instrument: any) => instrument?.name)
      .map(toBackendRecordOption),
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
  }), [instruments, testSteps, plan, selectedStep?.id]);

  useEffect(() => {
    if (!selectedStep) {
      setSchemaResponse(null);
      setSchemaError(null);
      setSchemaPropertyValues({});
      return;
    }
    let cancelled = false;
    setSchemaResponse(null);
    setSchemaError(null);

    const fetchSchema = async () => {
      try {
        const stepTypeName =
          selectedStep.stepTypeName ??
          selectedStep.typeName ??
          selectedStep.fullName ??
          selectedStep.className ??
          selectedStep.name;
        const data = await getStepSchema(stepTypeName);
        if (cancelled) return;
        setSchemaResponse(data);
        setSchemaError(null);
      } catch (err) {
        if (cancelled) return;
        setSchemaError(String(err));
      }
    };

    fetchSchema();
    return () => { cancelled = true; };
  }, [selectedStep?.name]);

  useEffect(() => {
    if (!selectedStep) { setSchemaPropertyValues({}); return; }
    const values: Record<string, any> = {};
    schemaProperties.forEach((prop: any) => {
      const key = getSchemaPropertyKey(prop);
      const existing = selectedStep.properties?.find((item: any) => item.key === key);
      values[prop.name] = existing?.value ?? (prop.editorType === "checkbox" ? false : "");
    });
    setSchemaPropertyValues(values);
  }, [selectedStep, schemaProperties]);

  const getTypedValue = (prop: any, value: any) => {
    const type = (prop.editorType || "").toLowerCase();

    // Handle CommandType explicitly
    if (prop.name === "CommandType") {
      return Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];
    }

    switch (type) {
      case "integer":
        return value === "" ? 0 : parseInt(value, 10);

      case "number":
        return value === "" ? 0 : Number(value);

      case "checkbox":
        return Boolean(value);

      case "multiselect":
        return Array.isArray(value)
          ? value
          : value
            ? [value]
            : [];

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

      default:
        return value;
    }
  };

  const commitSchemaProperties = () => {
    if (!selectedStep) return;
    const meta = schemaRecords[0];

    setPlan((prev: any) => updateIn(prev, selectedStep.id, (step: any) => {
      const existingProps = step.properties || [];

      const newProps = schemaProperties.map((prop: any) => {
        const key = getSchemaPropertyKey(prop);
        return {
          key,
          label: prop.name || prop.displayName,
          type: prop.editorType === "checkbox" ? "boolean" : prop.editorType === "number" ? "number" : "string",
          value: getTypedValue(prop, schemaPropertyValues[prop.name]),
          group: "Schema Properties",
        };
      });

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
  };

  if (!selectedStep) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Sliders size={24} className="opacity-20" />
        <span className="text-[12px] font-mono">Select a step to inspect</span>
      </div>
    );
  }

  const groups: string[] = Array.from(
    new Set((selectedStep.properties || []).map((p: any) => p.group as string))
  ).filter((group): group is string => group !== "Schema Properties");

  const stripe = TYPE_STRIPE[selectedStep.type] || "#64748b";

  return (
    <div className="overflow-y-auto h-full">
      {/* Step identity */}
      <div className="border-b border-border" style={{ borderLeft: `3px solid ${stripe}` }}>
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeIcon type={selectedStep.type} size={14} />
            <span className="text-[13px] font-semibold text-foreground font-mono leading-tight">{selectedStep.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={selectedStep.status} />
            <span className="text-[11px] font-mono text-muted-foreground">{(selectedStep.id || "unknown").toUpperCase()}</span>
            {selectedStep.description && (
              <span className="text-[11px] text-muted-foreground">· {selectedStep.description}</span>
            )}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Enabled</span>
          <Toggle
            value={selectedStep.enabled}
            onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, enabled: !s.enabled })))}
          />
        </div>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Breakpoint</span>
          <Toggle
            value={!!selectedStep.breakpoint}
            onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, breakpoint: !s.breakpoint })))}
          />
        </div>
      </div>

      {/* Properties by group */}
      {groups.map(group => (
        <div key={group}>
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
            <div className="w-[3px] h-3" style={{ background: stripe }} />
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{group}</span>
          </div>
          {(selectedStep.properties || []).filter((p: any) => p.group === group).map((prop: any) => (
            <div key={prop.key} className="px-3 py-2.5 border-b border-border/40">
              <label className={labelCls}>{prop.label}</label>
              {prop.type === "boolean" ? (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-mono text-foreground">{prop.value ? "True" : "False"}</span>
                  <Toggle
                    value={prop.value as boolean}
                    onChange={() => updateProperty(selectedStep.id, prop.key, String(!prop.value))}
                  />
                </div>
              ) : prop.type === "enum" ? (
                <select
                  value={String(prop.value)}
                  onChange={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                  className={inputCls}
                >
                  {prop.options?.map((o: any) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    key={`${selectedStep.id}-${prop.key}`}
                    defaultValue={prop.type === "frequency" ? formatFreq(prop.value as number) : String(prop.value)}
                    onBlur={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className={`flex-1 ${inputCls} min-w-0`}
                  />
                  {prop.unit && prop.type !== "frequency" && (
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0">{prop.unit}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Dynamic Schema Properties */}
      <div>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
          <div className="w-[3px] h-3" style={{ background: stripe }} />
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">Properties</span>
        </div>
        {schemaProperties.length > 0
          ? schemaProperties.map((prop: any) =>
            renderEditor(prop, schemaPropertyValues, setSchemaPropertyValues, editorContext)
          )
          : (
            <div className="px-3 py-4 text-[12px] text-muted-foreground font-mono">
              {schemaError ? `Unable to load schema: ${schemaError}` : "No configurable properties."}
            </div>
          )
        }
        <div className="px-3 py-3 border-t border-border mt-1">
          <button
            onClick={commitSchemaProperties}
            className="w-full h-8 text-[12px] font-mono bg-info hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 border border-border transition-colors"
          >
            <Plug size={11} /> Add Properties
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-border flex gap-2 mt-1">
        <button
          onClick={() => { setAddStepParentId(null); setShowAddStep(true); }}
          className="flex-1 h-8 text-[12px] font-mono bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 border border-border transition-colors"
        >
          <Plus size={11} /> Add Step
        </button>
        <button
          onClick={() => {
            if (selectedId) {
              setPlan((prev: any) => deleteIn(prev, selectedId));
              setSelectedId(null);
            }
          }}
          className="flex-1 h-8 text-[12px] font-mono text-red-500 hover:bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}
