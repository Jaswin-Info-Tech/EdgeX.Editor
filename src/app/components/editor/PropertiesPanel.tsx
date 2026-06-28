// PropertiesPanel.tsx
import { Plus, Sliders, Trash2, Plug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { TYPE_STRIPE } from "../../constants/editor";
import { deleteIn, flatAll, formatFreq, updateIn } from "../../utils/editor";
import { StatusPill, Toggle, TypeIcon } from "./atoms";
import { getStepSchema } from "../../api/plugin";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary";
const labelCls =
  "block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wide";
const wrapCls = "px-3 py-2.5 border-b border-border/40";

// ─── Shared sub-components ────────────────────────────────────────────────────
function FieldLabel({ children }: { children: ReactNode }) {
  return <label className={labelCls}>{children}</label>;
}

function FieldWrap({ children }: { children: ReactNode }) {
  return <div className={wrapCls}>{children}</div>;
}

// ─── Editor props type ────────────────────────────────────────────────────────
interface EditorProps {
  prop: any;
  value: any;
  onChange: (val: any) => void;
}

type SelectOption = string | { label: string; value: string; description?: string };

interface EditorContext {
  instrumentOptions: SelectOption[];
  testStepOptions: SelectOption[];
  planStepOptions: SelectOption[];
}

const normalizeOption = (item: SelectOption) =>
  typeof item === "string" ? { label: item, value: item } : item;

const getSelectOptions = (prop: any): SelectOption[] =>
  (prop.enumValues?.length ?? 0) > 0 ? prop.enumValues : prop.options ?? [];

const normalizeEditorType = (editorType: string = "") =>
  editorType.trim().toLowerCase().replace(/[\s_]+/g, "-");

const toBackendRecordOption = (item: any): SelectOption => ({
  label: String(item?.name ?? ""),
  value: String(item?.name ?? ""),
  description: [item?.baseType, item?.assembly].filter(Boolean).join(" | "),
});

const getSchemaRecords = (response: any) => {
  if (Array.isArray(response?.schemas)) return response.schemas;
  if (Array.isArray(response)) return response;
  if (response?.properties) return [response];
  return [];
};

// ─── text ─────────────────────────────────────────────────────────────────────
function TextEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── textarea ─────────────────────────────────────────────────────────────────
function TextareaEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        rows={4}
        value={value ?? ""}
        className={inputCls}
        placeholder="Enter text..."
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── number (decimal) ─────────────────────────────────────────────────────────
function NumberEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        step="any"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </FieldWrap>
  );
}

// ─── integer ──────────────────────────────────────────────────────────────────
function IntegerEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        step="1"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
      />
    </FieldWrap>
  );
}

// ─── checkbox ─────────────────────────────────────────────────────────────────
function CheckboxEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <Toggle value={Boolean(value)} onChange={() => onChange(!Boolean(value))} />
      </div>
    </FieldWrap>
  );
}

// ─── select (dropdown / instrument-selector / dut-selector / result-listener/test-step) ─
function SelectEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const options = getSelectOptions(prop);
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select one</option>
        {options.map(item => {
          const option = normalizeOption(item);
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </FieldWrap>
  );
}

// ─── multiselect ──────────────────────────────────────────────────────────────
function MultiselectEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const options = getSelectOptions(prop);
  const selected: string[] = Array.isArray(value) ? value : [];

  const toggle = (item: SelectOption) => {
    const option = normalizeOption(item);
    const next = selected.includes(option.value)
      ? selected.filter(s => s !== option.value)
      : [...selected, option.value];
    onChange(next);
  };

  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-1 mt-1">
        {options.map(item => {
          const option = normalizeOption(item);
          return (
            <label key={option.value} className="flex items-center gap-2 text-[12px] font-mono text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggle(item)}
                className="accent-primary"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </FieldWrap>
  );
}

// ─── datetime ─────────────────────────────────────────────────────────────────
function DateTimeEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="datetime-local"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── date ─────────────────────────────────────────────────────────────────────
function DateEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="date"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── time ─────────────────────────────────────────────────────────────────────
function TimeEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="time"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── duration (HH:MM:SS) ──────────────────────────────────────────────────────
function DurationEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value ?? ""}
        placeholder="HH:MM:SS"
        pattern="\d{2}:\d{2}:\d{2}"
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
      <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Format: HH:MM:SS</span>
    </FieldWrap>
  );
}

// ─── array (dynamic list) ─────────────────────────────────────────────────────
function ArrayEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const items: string[] = Array.isArray(value) ? value : [];

  const updateItem = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    onChange(next);
  };
  const addItem = () => onChange([...items, ""]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-1 mt-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <input
              type="text"
              value={item}
              className={inputCls}
              onChange={e => updateItem(idx, e.target.value)}
            />
            <button
              onClick={() => removeItem(idx)}
              className="text-red-400 hover:text-red-600 text-[11px] font-mono px-1"
            >✕</button>
          </div>
        ))}
        <button
          onClick={addItem}
          className="mt-1 text-[11px] font-mono text-primary hover:underline text-left"
        >+ Add item</button>
      </div>
    </FieldWrap>
  );
}

// ─── keyvalue (dictionary) ────────────────────────────────────────────────────
function KeyValueEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const pairs: { k: string; v: string }[] = Array.isArray(value) ? value : [];

  const updatePair = (idx: number, field: "k" | "v", val: string) => {
    const next = [...pairs];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };
  const addPair = () => onChange([...pairs, { k: "", v: "" }]);
  const removePair = (idx: number) => onChange(pairs.filter((_, i) => i !== idx));

  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-1 mt-1">
        {pairs.map((pair, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <input
              type="text"
              value={pair.k}
              placeholder="Key"
              className={inputCls}
              onChange={e => updatePair(idx, "k", e.target.value)}
            />
            <span className="text-muted-foreground font-mono text-[11px]">:</span>
            <input
              type="text"
              value={pair.v}
              placeholder="Value"
              className={inputCls}
              onChange={e => updatePair(idx, "v", e.target.value)}
            />
            <button
              onClick={() => removePair(idx)}
              className="text-red-400 hover:text-red-600 text-[11px] font-mono px-1"
            >✕</button>
          </div>
        ))}
        <button
          onClick={addPair}
          className="mt-1 text-[11px] font-mono text-primary hover:underline text-left"
        >+ Add pair</button>
      </div>
    </FieldWrap>
  );
}

// ─── object (expandable) ──────────────────────────────────────────────────────
function ObjectEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const [open, setOpen] = useState(false);
  const str = typeof value === "object" ? JSON.stringify(value, null, 2) : (value ?? "{}");

  return (
    <FieldWrap>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <FieldLabel>{label}</FieldLabel>
        <span className="text-[10px] font-mono text-muted-foreground">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <textarea
          rows={6}
          value={str}
          className={`${inputCls} mt-1`}
          placeholder="{}"
          onChange={e => {
            try { onChange(JSON.parse(e.target.value)); }
            catch { onChange(e.target.value); }
          }}
        />
      )}
    </FieldWrap>
  );
}

// ─── file ─────────────────────────────────────────────────────────────────────
function FileEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-1">
        <input
          type="text"
          value={value ?? ""}
          placeholder="File path..."
          className={inputCls}
          onChange={e => onChange(e.target.value)}
        />
        <label className="shrink-0 px-2 py-1.5 border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer">
          Browse
          <input
            type="file"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) onChange(e.target.files[0].name); }}
          />
        </label>
      </div>
    </FieldWrap>
  );
}

// ─── folder ───────────────────────────────────────────────────────────────────
function FolderEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-1">
        <input
          type="text"
          value={value ?? ""}
          placeholder="Folder path..."
          className={inputCls}
          onChange={e => onChange(e.target.value)}
        />
        <label className="shrink-0 px-2 py-1.5 border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer">
          Browse
          <input
            type="file"
            // @ts-ignore – non-standard but widely supported
            webkitdirectory="true"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onChange((f as any).webkitRelativePath?.split("/")?.[0] ?? f.name);
            }}
          />
        </label>
      </div>
    </FieldWrap>
  );
}

// ─── step-selector ────────────────────────────────────────────────────────────
function StepSelectorEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const steps = getSelectOptions(prop);
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <select value={value ?? ""} className={inputCls} onChange={e => onChange(e.target.value)}>
        <option value="">Select step</option>
        {steps.map(s => {
          const option = normalizeOption(s);
          return (
            <option key={option.value} value={option.value}>
              {option.description ? `${option.label} - ${option.description}` : option.label}
            </option>
          );
        })}
      </select>
    </FieldWrap>
  );
}

// ─── readonly ─────────────────────────────────────────────────────────────────
function ReadonlyEditor({ prop, value }: Omit<EditorProps, "onChange">) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <span className="text-[12px] font-mono text-muted-foreground">{String(value ?? "—")}</span>
    </FieldWrap>
  );
}

// ─── unknown / fallback ───────────────────────────────────────────────────────
function UnknownEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>
        {label}
        <span className="ml-2 text-[10px] text-yellow-500 normal-case">[{prop.editorType}]</span>
      </FieldLabel>
      <input
        type="text"
        value={value ?? ""}
        className={inputCls}
        onChange={e => onChange(e.target.value)}
      />
    </FieldWrap>
  );
}

// ─── Master renderer ──────────────────────────────────────────────────────────
function renderEditor(
  prop: any,
  schemaPropertyValues: Record<string, any>,
  setSchemaPropertyValues: Dispatch<SetStateAction<Record<string, any>>>,
  context: EditorContext
) {
  const value = schemaPropertyValues[prop.name];
  const onChange = (val: any) =>
    setSchemaPropertyValues(prev => ({ ...prev, [prop.name]: val }));
  const editorType = normalizeEditorType(prop.editorType);
  const propWithContext = (() => {
    const hasStaticOptions = (prop.enumValues?.length ?? 0) > 0 || (prop.options?.length ?? 0) > 0;
    if (hasStaticOptions) return prop;

    if (editorType === "instrument-selector") {
      return { ...prop, options: context.instrumentOptions };
    }

    if (editorType === "test-step") {
      return { ...prop, options: context.testStepOptions };
    }

    if (editorType === "step-selector") {
      return { ...prop, options: context.planStepOptions };
    }

    return prop;
  })();

  switch (editorType) {
    case "text": return <TextEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "textarea": return <TextareaEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "number": return <NumberEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "integer": return <IntegerEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "checkbox": return <CheckboxEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "select":
    case "dropdown":
    case "instrument-selector":
    case "test-step":
    case "dut-selector":
    case "result-listener-selector":
      return <SelectEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "multiselect": return <MultiselectEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "datetime": return <DateTimeEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "date": return <DateEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "time": return <TimeEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "duration": return <DurationEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "array": return <ArrayEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "keyvalue": return <KeyValueEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "object": return <ObjectEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "step-selector": return <StepSelectorEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "file": return <FileEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "folder": return <FolderEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "readonly": return <ReadonlyEditor key={prop.name} prop={propWithContext} value={value} />;
    case "hidden": return null;
    default: return <UnknownEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
  }
}

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

  const getSchemaPropertyKey = (prop: any) => `${prop.displayName || prop.name} || ${prop.name}`;
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
        const data = await getStepSchema(selectedStep.name);
        if (cancelled) return;
        setSchemaResponse(data);
        setSchemaError(null);
      } catch (err) {
        if (cancelled) return;
        setSchemaError(String(err));
      }
    };
    fetchSchema();
    return () => {
      cancelled = true;
    };
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

  const commitSchemaProperties = () => {
    if (!selectedStep) return;

    setPlan((prev: any) => updateIn(prev, selectedStep.id, (step: any) => {
      const existingProps = step.properties || [];

      const newProps = schemaProperties.map((prop: any) => {
        const key = getSchemaPropertyKey(prop);
        return {
          key,
          label: prop.displayName || prop.name,
          type: prop.editorType === "checkbox" ? "boolean" : prop.editorType === "number" ? "number" : "string",
          value: schemaPropertyValues[prop.name],
          group: "Schema Properties",
        };
      });

      // Remove ALL existing "Schema Properties" group entries first, then add fresh ones
      const keepProps = existingProps.filter((item: any) => item.group !== "Schema Properties");

      return { ...step, properties: [...keepProps, ...newProps] };
    }));
  };

  const renderProperties = () => {
    if (!selectedStep) return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Sliders size={24} className="opacity-20" />
        <span className="text-[12px] font-mono">Select a step to inspect</span>
      </div>
    );

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
              {selectedStep.description && <span className="text-[11px] text-muted-foreground">· {selectedStep.description}</span>}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Enabled</span>
            <Toggle value={selectedStep.enabled} onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, enabled: !s.enabled })))} />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Breakpoint</span>
            <Toggle value={!!selectedStep.breakpoint} onChange={() => setPlan((prev: any) => updateIn(prev, selectedStep.id, s => ({ ...s, breakpoint: !s.breakpoint })))} />
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
                    <Toggle value={prop.value as boolean} onChange={() => updateProperty(selectedStep.id, prop.key, String(!prop.value))} />
                  </div>
                ) : prop.type === "enum" ? (
                  <select value={String(prop.value)} onChange={e => updateProperty(selectedStep.id, prop.key, e.target.value)} className={inputCls}>
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
                    {prop.unit && prop.type !== "frequency" && <span className="text-[11px] text-muted-foreground font-mono shrink-0">{prop.unit}</span>}
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
            ? schemaProperties.map((prop: any) => renderEditor(prop, schemaPropertyValues, setSchemaPropertyValues, editorContext))
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
            onClick={() => { if (selectedId) { setPlan((prev: any) => deleteIn(prev, selectedId)); setSelectedId(null); } }}
            className="flex-1 h-8 text-[12px] font-mono text-red-500 hover:bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    );
  };

  return renderProperties();
}
