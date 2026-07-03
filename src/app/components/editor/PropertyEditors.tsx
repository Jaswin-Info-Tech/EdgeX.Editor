import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Toggle } from "./atoms";

// ─── Shared styles ────────────────────────────────────────────────────────────
export const inputCls =
  "w-full bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary";
export const labelCls =
  "block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wide";
export const wrapCls = "px-3 py-2.5 border-b border-border/40";

// ─── Shared sub-components ────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className={labelCls}>{children}</label>;
}

export function FieldWrap({ children }: { children: ReactNode }) {
  return <div className={wrapCls}>{children}</div>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EditorProps {
  prop: any;
  value: any;
  onChange: (val: any) => void;
}

export type SelectOption = string | { label: string; value: string; description?: string };

export interface EditorContext {
  instrumentOptions: SelectOption[];
  resourceOptions: SelectOption[];
  testStepOptions: SelectOption[];
  planStepOptions: SelectOption[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const normalizeOption = (item: SelectOption) =>
  typeof item === "string" ? { label: item, value: item } : item;

export const getSelectOptions = (prop: any): SelectOption[] =>
  (prop.enumValues?.length ?? 0) > 0 ? prop.enumValues : prop.options ?? [];

export const normalizeEditorType = (editorType: string = "") =>
  editorType.trim().toLowerCase().replace(/[\s_]+/g, "-");

export const toBackendRecordOption = (item: any): SelectOption => ({
  label: String(item?.name ?? ""),
  value: String(item?.name ?? ""),
  description: [item?.baseType, item?.assembly].filter(Boolean).join(" | "),
});

export const toResourceRecordOption = (item: any): SelectOption => ({
  label: String(item?.name ?? ""),
  value: String(item?.name ?? ""),
  description: [item?.instrument, item?.status].filter(Boolean).join(" | "),
});

export const getSchemaRecords = (response: any) => {
  if (Array.isArray(response?.schemas)) return response.schemas;
  if (Array.isArray(response)) return response;
  if (response?.properties) return [response];
  return [];
};

// ─── text ─────────────────────────────────────────────────────────────────────
export function TextEditor({ prop, value, onChange }: EditorProps) {
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
export function TextareaEditor({ prop, value, onChange }: EditorProps) {
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
export function NumberEditor({ prop, value, onChange }: EditorProps) {
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
export function IntegerEditor({ prop, value, onChange }: EditorProps) {
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
export function CheckboxEditor({ prop, value, onChange }: EditorProps) {
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

// ─── select ───────────────────────────────────────────────────────────────────
export function SelectEditor({ prop, value, onChange }: EditorProps) {
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
export function MultiselectEditor({ prop, value, onChange }: EditorProps) {
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
export function DateTimeEditor({ prop, value, onChange }: EditorProps) {
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
export function DateEditor({ prop, value, onChange }: EditorProps) {
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
export function TimeEditor({ prop, value, onChange }: EditorProps) {
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

// ─── duration ─────────────────────────────────────────────────────────────────
export function DurationEditor({ prop, value, onChange }: EditorProps) {
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

// ─── array ────────────────────────────────────────────────────────────────────
export function ArrayEditor({ prop, value, onChange }: EditorProps) {
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

// ─── keyvalue ─────────────────────────────────────────────────────────────────
export function KeyValueEditor({ prop, value, onChange }: EditorProps) {
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

// ─── object ───────────────────────────────────────────────────────────────────
export function ObjectEditor({ prop, value, onChange }: EditorProps) {
  const label = prop.displayName || prop.name;
  const [open, setOpen] = useState(false);
  const str = value == null ? "" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

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
            const raw = e.target.value;
            if (raw.trim() === "") {
              onChange(null);
              return;
            }

            try { onChange(JSON.parse(raw)); }
            catch { onChange(e.target.value); }
          }}
        />
      )}
    </FieldWrap>
  );
}

// ─── file ─────────────────────────────────────────────────────────────────────
export function FileEditor({ prop, value, onChange }: EditorProps) {
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
export function FolderEditor({ prop, value, onChange }: EditorProps) {
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
export function StepSelectorEditor({ prop, value, onChange }: EditorProps) {
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
export function ReadonlyEditor({ prop, value }: Omit<EditorProps, "onChange">) {
  const label = prop.displayName || prop.name;
  return (
    <FieldWrap>
      <FieldLabel>{label}</FieldLabel>
      <span className="text-[12px] font-mono text-muted-foreground">{String(value ?? "—")}</span>
    </FieldWrap>
  );
}

// ─── unknown / fallback ───────────────────────────────────────────────────────
export function UnknownEditor({ prop, value, onChange }: EditorProps) {
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
export function renderEditor(
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
      return {
        ...prop,
        options: context.instrumentOptions ?? [],
      };
    }
    if (editorType === "test-step") return { ...prop, options: context.testStepOptions };
    if (editorType === "step-selector") return { ...prop, options: context.planStepOptions };
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
    case "object":
    case "json": return <ObjectEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "step-selector": return <StepSelectorEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "file": return <FileEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "folder": return <FolderEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
    case "readonly": return <ReadonlyEditor key={prop.name} prop={propWithContext} value={value} />;
    case "hidden": return null;
    default: return <UnknownEditor key={prop.name} prop={propWithContext} value={value} onChange={onChange} />;
  }
}
