import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Square, Pause, FolderOpen, Save, FilePlus, ChevronRight, ChevronDown,
  Terminal, Plus, Trash2, Search, CheckCircle2, XCircle, Clock, Minus,
  Zap, Cpu, Wifi, Radio, Database, Activity, AlertTriangle, Settings,
  ChevronUp, GripVertical, Copy, RotateCcw, Eye, EyeOff, List, Layers,
  BarChart2, X, Upload, Package, ChevronLeft, Filter,
  ArrowUp, ArrowDown, Edit3, Check,
  FolderPlus, Download, RefreshCw, Sliders, Sun, Moon,
  PanelLeftOpen, PanelRightOpen, SlidersHorizontal
} from "lucide-react";
import { useUsers } from "./hooks/useUsers";

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped" | "error";
type RunState = "idle" | "running" | "paused" | "completed";

interface Property {
  key: string; label: string;
  type: "string" | "number" | "boolean" | "enum" | "frequency";
  value: string | number | boolean; unit?: string; options?: string[]; group: string;
}

interface TestStep {
  id: string; name: string; type: string; status: StepStatus;
  children?: TestStep[]; enabled: boolean; properties: Property[];
  description?: string; breakpoint?: boolean;
}

interface LogEntry {
  id: number; timestamp: string;
  level: "INFO" | "DEBUG" | "WARN" | "ERROR" | "PASS" | "FAIL";
  source: string; message: string;
}

interface LibraryItem {
  id: string; name: string; category: string; description: string; type: string; pluginId?: string;
  defaultProps: Property[];
}

interface Plugin {
  id: string; name: string; version: string; author: string; description: string;
  status: "installed" | "installing" | "available"; steps: LibraryItem[];
}

interface PlanMeta {
  name: string; description: string; author: string; version: string;
  dutName: string; dutSerial: string; dutModel: string; dutFirmware: string;
}

interface CtxMenu { x: number; y: number; stepId: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 100;
const uid = () => `s${++_uid}`;

function formatFreq(hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`;
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(3)} kHz`;
  return `${hz} Hz`;
}

function parseFreq(s: string): number {
  const n = parseFloat(s);
  if (s.toLowerCase().includes("ghz")) return n * 1e9;
  if (s.toLowerCase().includes("mhz")) return n * 1e6;
  if (s.toLowerCase().includes("khz")) return n * 1e3;
  return n || 0;
}

function flatAll(steps: TestStep[]): TestStep[] {
  return steps.flatMap(s => [s, ...(s.children ? flatAll(s.children) : [])]);
}

function updateIn(steps: TestStep[], id: string, fn: (s: TestStep) => TestStep): TestStep[] {
  return steps.map(s => s.id === id ? fn(s) : { ...s, children: s.children ? updateIn(s.children, id, fn) : undefined });
}

function deleteIn(steps: TestStep[], id: string): TestStep[] {
  return steps.filter(s => s.id !== id).map(s => ({ ...s, children: s.children ? deleteIn(s.children, id) : undefined }));
}

function moveIn(steps: TestStep[], id: string, dir: "up" | "down"): TestStep[] {
  const idx = steps.findIndex(s => s.id === id);
  if (idx !== -1) {
    const arr = [...steps];
    const to = dir === "up" ? idx - 1 : idx + 1;
    if (to >= 0 && to < arr.length) [arr[idx], arr[to]] = [arr[to], arr[idx]];
    return arr;
  }
  return steps.map(s => ({ ...s, children: s.children ? moveIn(s.children, id, dir) : undefined }));
}

function addToParent(steps: TestStep[], parentId: string | null, step: TestStep, atIdx?: number): TestStep[] {
  if (!parentId) {
    if (atIdx !== undefined) { const a = [...steps]; a.splice(atIdx, 0, step); return a; }
    return [...steps, step];
  }
  return steps.map(s => {
    if (s.id === parentId) {
      const ch = [...(s.children || [])];
      atIdx !== undefined ? ch.splice(atIdx, 0, step) : ch.push(step);
      return { ...s, children: ch };
    }
    return { ...s, children: s.children ? addToParent(s.children, parentId, step, atIdx) : undefined };
  });
}

function setStatusIn(steps: TestStep[], id: string, status: StepStatus): TestStep[] {
  return steps.map(s => ({
    ...s, status: s.id === id ? status : s.status,
    children: s.children ? setStatusIn(s.children, id, status) : undefined,
  }));
}

function resetAll(steps: TestStep[]): TestStep[] {
  return steps.map(s => ({ ...s, status: "pending" as StepStatus, children: s.children ? resetAll(s.children) : undefined }));
}

function makeStep(lib: LibraryItem): TestStep {
  return { id: uid(), name: lib.name, type: lib.type, status: "pending", enabled: true, description: lib.description, properties: lib.defaultProps.map(p => ({ ...p })) };
}

function makeSequence(name = "New Sequence"): TestStep {
  return {
    id: uid(), name, type: "sequence", status: "pending", enabled: true, description: "Test sequence container",
    properties: [
      { key: "name", label: "Name", type: "string", value: name, group: "General" },
      { key: "verdict", label: "Verdict Logic", type: "enum", value: "AND", options: ["AND", "OR", "First"], group: "General" },
      { key: "break_on_fail", label: "Break on Fail", type: "boolean", value: true, group: "Execution" },
    ],
    children: [],
  };
}

function nowTs() { return new Date().toISOString().slice(11, 23); }

// ─── Design tokens ────────────────────────────────────────────────────────────

const TYPE_STRIPE: Record<string, string> = {
  sequence: "#3b82f6", rf: "#a855f7", measure: "#10b981",
  network: "#06b6d4", hw: "#f97316", instrument: "#eab308", flow: "#64748b",
};

const TYPE_LABEL: Record<string, string> = {
  sequence: "SEQ", rf: "RF", measure: "MSR", network: "NET",
  hw: "HW", instrument: "INST", flow: "FLOW",
};

const STATUS_COLOR: Record<StepStatus, string> = {
  pending: "text-muted-foreground", running: "text-yellow-500",
  passed: "text-emerald-500", failed: "text-red-500",
  skipped: "text-muted-foreground", error: "text-red-600",
};

const STATUS_BG: Record<StepStatus, string> = {
  pending: "", running: "bg-yellow-500/5 border-l-yellow-500/60",
  passed: "bg-emerald-500/5 border-l-emerald-500/40",
  failed: "bg-red-500/5 border-l-red-500/40",
  skipped: "opacity-50", error: "bg-red-600/5 border-l-red-600/40",
};

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StatusIcon({ status, size = 13 }: { status: StepStatus; size?: number }) {
  const cls = `${STATUS_COLOR[status]} shrink-0`;
  if (status === "running") return <Activity size={size} className={`${cls} animate-pulse`} />;
  if (status === "passed") return <CheckCircle2 size={size} className={cls} />;
  if (status === "failed") return <XCircle size={size} className={cls} />;
  if (status === "error") return <AlertTriangle size={size} className={cls} />;
  if (status === "skipped") return <Minus size={size} className={cls} />;
  return <Clock size={size} className={`${cls} opacity-30`} />;
}

function TypeIcon({ type, size = 13 }: { type: string; size?: number }) {
  const col = TYPE_STRIPE[type] || "#64748b";
  const p = { size, style: { color: col } };
  if (type === "sequence") return <Layers {...p} />;
  if (type === "rf") return <Radio {...p} />;
  if (type === "measure") return <BarChart2 {...p} />;
  if (type === "network") return <Wifi {...p} />;
  if (type === "hw") return <Cpu {...p} />;
  if (type === "instrument") return <Zap {...p} />;
  return <Clock {...p} />;
}

function StatusPill({ status }: { status: StepStatus }) {
  const styles: Record<StepStatus, string> = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-yellow-500/20 text-yellow-500",
    passed: "bg-emerald-500/20 text-emerald-500",
    failed: "bg-red-500/20 text-red-500",
    skipped: "bg-muted text-muted-foreground",
    error: "bg-red-600/20 text-red-600",
  };
  return (
    <span className={`px-1.5 py-0 text-[11px] font-mono font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function PanelHeader({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-muted/40 shrink-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[12px] font-semibold text-foreground tracking-widest uppercase font-mono">{label}</span>
      {children && <div className="ml-auto flex items-center gap-1">{children}</div>}
    </div>
  );
}

function ToolBtn({ onClick, disabled, title, children, active = false, variant = "ghost" }: any) {
  const base = "flex items-center gap-1.5 px-2.5 h-8 text-[12px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 border";
  const v = variant === "run"
    ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25"
    : variant === "danger"
    ? "text-red-500 border-transparent hover:bg-red-500/10 hover:border-red-500/20"
    : active
    ? "bg-primary/10 text-primary border-primary/30"
    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary hover:border-border";
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${base} ${v}`}>
      {children}
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`w-9 h-5 relative transition-colors border ${value ? "bg-primary border-primary" : "bg-muted border-border"}`}>
      <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white transition-all ${value ? "left-[19px]" : "left-0.5"}`} />
    </button>
  );
}

// ─── Drag resize ──────────────────────────────────────────────────────────────

function useDragResize(dir: "h" | "v", onDelta: (d: number) => void) {
  const start = useRef(0);
  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    start.current = dir === "h" ? e.clientX : e.clientY;
    const move = (ev: MouseEvent) => {
      const pos = dir === "h" ? ev.clientX : ev.clientY;
      onDelta(pos - start.current);
      start.current = pos;
    };
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }, [dir, onDelta]);
}

function Splitter({ onMouseDown, dir }: { onMouseDown: (e: React.MouseEvent) => void; dir: "h" | "v" }) {
  const [hot, setHot] = useState(false);
  const down = (e: React.MouseEvent) => { setHot(true); onMouseDown(e); };
  useEffect(() => {
    if (!hot) return;
    const up = () => setHot(false);
    document.addEventListener("mouseup", up);
    return () => document.removeEventListener("mouseup", up);
  }, [hot]);
  return (
    <div onMouseDown={down}
      className={`shrink-0 z-10 transition-colors flex items-center justify-center
        ${dir === "h" ? "w-[4px] cursor-col-resize flex-col gap-1" : "h-[4px] cursor-row-resize flex-row gap-1"}
        ${hot ? "bg-primary/60" : "bg-border hover:bg-primary/40"}`}>
      {[0, 1, 2].map(i => (
        <div key={i} className={`bg-foreground/20 ${dir === "h" ? "w-[2px] h-5" : "h-[2px] w-5"}`} />
      ))}
    </div>
  );
}

// ─── Library Data ─────────────────────────────────────────────────────────────

const BASE_LIBRARY: LibraryItem[] = [
  { id: "lb1", name: "Set Frequency", category: "RF Instruments", type: "rf", description: "Set center frequency on signal analyzer",
    defaultProps: [
      { key: "freq", label: "Center Frequency", type: "frequency", value: 2400000000, unit: "Hz", group: "RF Parameters" },
      { key: "span", label: "Span", type: "frequency", value: 100000000, unit: "Hz", group: "RF Parameters" },
      { key: "rbw", label: "Resolution BW", type: "frequency", value: 1000000, unit: "Hz", group: "RF Parameters" },
      { key: "ref_level", label: "Reference Level", type: "number", value: 10, unit: "dBm", group: "RF Parameters" },
    ]},
  { id: "lb2", name: "Measure Power", category: "RF Instruments", type: "measure", description: "Measure average power level",
    defaultProps: [
      { key: "averages", label: "Averages", type: "number", value: 10, group: "Measurement" },
      { key: "expected", label: "Expected Power", type: "number", value: -10.0, unit: "dBm", group: "Limits" },
      { key: "tolerance", label: "Tolerance ±", type: "number", value: 2.0, unit: "dB", group: "Limits" },
      { key: "on_fail", label: "Verdict on Fail", type: "enum", value: "Fail", options: ["Fail", "Inconclusive", "Pass"], group: "Limits" },
    ]},
  { id: "lb3", name: "Set Attenuation", category: "RF Instruments", type: "rf", description: "Set attenuator level",
    defaultProps: [
      { key: "atten", label: "Attenuation", type: "number", value: 0, unit: "dB", group: "Parameters" },
      { key: "port", label: "Port", type: "enum", value: "RF1", options: ["RF1", "RF2", "RF3", "RF4"], group: "Parameters" },
    ]},
  { id: "lb4", name: "Sweep Frequency", category: "RF Instruments", type: "rf", description: "Sweep across a frequency range",
    defaultProps: [
      { key: "start", label: "Start Frequency", type: "frequency", value: 1000000000, unit: "Hz", group: "Sweep" },
      { key: "stop", label: "Stop Frequency", type: "frequency", value: 3000000000, unit: "Hz", group: "Sweep" },
      { key: "points", label: "Points", type: "number", value: 401, group: "Sweep" },
    ]},
  { id: "lb5", name: "Verify Harmonics", category: "RF Instruments", type: "measure", description: "Measure and verify harmonic levels",
    defaultProps: [
      { key: "limit", label: "Harmonic Limit", type: "number", value: -40, unit: "dBc", group: "Limits" },
      { key: "order", label: "Max Harmonic Order", type: "number", value: 3, group: "Measurement" },
    ]},
  { id: "lb6", name: "Ping Host", category: "Network", type: "network", description: "Send ICMP ping to target host",
    defaultProps: [
      { key: "host", label: "Host / IP", type: "string", value: "192.168.1.1", group: "Target" },
      { key: "count", label: "Ping Count", type: "number", value: 4, group: "Parameters" },
      { key: "timeout", label: "Timeout", type: "number", value: 1000, unit: "ms", group: "Parameters" },
      { key: "max_rtt", label: "Max RTT", type: "number", value: 5, unit: "ms", group: "Limits" },
    ]},
  { id: "lb7", name: "Check Latency", category: "Network", type: "network", description: "Measure round-trip network latency",
    defaultProps: [
      { key: "threshold", label: "Latency Threshold", type: "number", value: 5, unit: "ms", group: "Limits" },
      { key: "samples", label: "Sample Count", type: "number", value: 100, group: "Parameters" },
    ]},
  { id: "lb8", name: "TCP Connect", category: "Network", type: "network", description: "Verify TCP connection to endpoint",
    defaultProps: [
      { key: "host", label: "Host / IP", type: "string", value: "192.168.1.1", group: "Target" },
      { key: "port", label: "TCP Port", type: "number", value: 443, group: "Target" },
      { key: "timeout", label: "Connect Timeout", type: "number", value: 3000, unit: "ms", group: "Parameters" },
    ]},
  { id: "lb9", name: "Delay", category: "Flow Control", type: "flow", description: "Wait for a specified duration",
    defaultProps: [
      { key: "delay", label: "Delay Duration", type: "number", value: 500, unit: "ms", group: "Parameters" },
      { key: "log", label: "Log Wait Message", type: "boolean", value: true, group: "Options" },
    ]},
  { id: "lb10", name: "Repeat", category: "Flow Control", type: "sequence", description: "Repeat child steps N times",
    defaultProps: [
      { key: "count", label: "Repeat Count", type: "number", value: 3, group: "Parameters" },
      { key: "break_on_fail", label: "Break on Fail", type: "boolean", value: false, group: "Parameters" },
    ]},
  { id: "lb11", name: "Read Register", category: "Hardware I/O", type: "hw", description: "Read a device register value",
    defaultProps: [
      { key: "address", label: "Register Address", type: "string", value: "0x04", group: "Target" },
      { key: "expected", label: "Expected Value", type: "string", value: "0xA5", group: "Limits" },
      { key: "mask", label: "Bit Mask", type: "string", value: "0xFF", group: "Limits" },
    ]},
  { id: "lb12", name: "Write Register", category: "Hardware I/O", type: "hw", description: "Write a value to a device register",
    defaultProps: [
      { key: "address", label: "Register Address", type: "string", value: "0x08", group: "Target" },
      { key: "value", label: "Write Value", type: "string", value: "0x01", group: "Parameters" },
      { key: "verify", label: "Verify Readback", type: "boolean", value: true, group: "Parameters" },
    ]},
  { id: "lb13", name: "Query SCPI", category: "Instruments", type: "instrument", description: "Send SCPI command and read response",
    defaultProps: [
      { key: "address", label: "Instrument Address", type: "string", value: "GPIB0::14::INSTR", group: "Connection" },
      { key: "command", label: "SCPI Command", type: "string", value: ":MEAS:POW?", group: "Command" },
      { key: "expected", label: "Expected Response", type: "string", value: "", group: "Limits" },
    ]},
  { id: "lb14", name: "Connect Instrument", category: "Instruments", type: "instrument", description: "Open VISA instrument connection",
    defaultProps: [
      { key: "address", label: "VISA Address", type: "string", value: "GPIB0::14::INSTR", group: "Connection" },
      { key: "timeout", label: "Timeout", type: "number", value: 5000, unit: "ms", group: "Connection" },
      { key: "reset", label: "Reset on Connect", type: "boolean", value: true, group: "Connection" },
    ]},
  { id: "lb15", name: "Log Message", category: "Utility", type: "flow", description: "Write a custom log message",
    defaultProps: [
      { key: "message", label: "Message", type: "string", value: "Test checkpoint reached", group: "Parameters" },
      { key: "level", label: "Log Level", type: "enum", value: "INFO", options: ["INFO", "DEBUG", "WARN", "ERROR"], group: "Parameters" },
    ]},
  { id: "lb16", name: "Disconnect All", category: "Instruments", type: "instrument", description: "Disconnect all instruments",
    defaultProps: [
      { key: "send_local", label: "Send GTL", type: "boolean", value: true, group: "Options" },
    ]},
];

const PRESET_PLUGINS: Plugin[] = [
  {
    id: "p1", name: "Keysight RF Suite", version: "3.2.1", author: "Keysight Technologies",
    description: "RF measurement steps for Keysight signal analyzers and generators (N9030, E4438C)",
    status: "installed",
    steps: [
      { id: "lp1a", name: "EVM Measurement", category: "Keysight RF", type: "measure", description: "Error Vector Magnitude measurement",
        defaultProps: [
          { key: "modulation", label: "Modulation", type: "enum", value: "QAM16", options: ["QAM16", "QAM64", "QAM256", "QPSK"], group: "Signal" },
          { key: "evm_limit", label: "EVM Limit", type: "number", value: -30, unit: "dB", group: "Limits" },
        ]},
      { id: "lp1b", name: "Phase Noise", category: "Keysight RF", type: "measure", description: "Phase noise measurement at offsets",
        defaultProps: [
          { key: "carrier", label: "Carrier Frequency", type: "frequency", value: 1000000000, unit: "Hz", group: "Parameters" },
          { key: "limit", label: "Phase Noise Limit", type: "number", value: -120, unit: "dBc/Hz", group: "Limits" },
        ]},
    ],
  },
  {
    id: "p2", name: "NI-DAQmx I/O", version: "1.5.0", author: "National Instruments",
    description: "Digital and analog I/O for NI DAQ hardware (USB-6001, PCIe-6321)",
    status: "available",
    steps: [
      { id: "lp2a", name: "Analog Input Read", category: "NI DAQmx", type: "hw", description: "Read analog voltage from DAQ channel",
        defaultProps: [
          { key: "device", label: "Device", type: "string", value: "Dev1", group: "Target" },
          { key: "channel", label: "Channel", type: "string", value: "ai0", group: "Target" },
          { key: "max_v", label: "Max Voltage", type: "number", value: 10, unit: "V", group: "Range" },
        ]},
    ],
  },
  {
    id: "p3", name: "Serial Protocol Tester", version: "2.0.3", author: "OpenTAP Community",
    description: "UART/SPI/I2C protocol verification steps",
    status: "available",
    steps: [
      { id: "lp3a", name: "UART Send", category: "Serial", type: "hw", description: "Send bytes over UART serial port",
        defaultProps: [
          { key: "port", label: "COM Port", type: "string", value: "COM3", group: "Connection" },
          { key: "baud", label: "Baud Rate", type: "number", value: 115200, group: "Connection" },
          { key: "data", label: "Data (hex)", type: "string", value: "AA BB CC", group: "Data" },
        ]},
      { id: "lp3b", name: "UART Receive & Verify", category: "Serial", type: "hw", description: "Wait for UART response and compare",
        defaultProps: [
          { key: "expected", label: "Expected Data (hex)", type: "string", value: "AA 00 FF", group: "Verification" },
          { key: "timeout", label: "Receive Timeout", type: "number", value: 1000, unit: "ms", group: "Connection" },
        ]},
    ],
  },
];

// ─── New Plan Wizard ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, textarea }: any) {
  const cls = "w-full bg-background border border-border px-3 py-2 text-[13px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";
  return (
    <div>
      <label className="block text-[11px] font-mono font-semibold text-muted-foreground mb-1 uppercase tracking-widest">{label}</label>
      {textarea
        ? <textarea className={`${cls} h-16 resize-none`} value={value} onChange={onChange} placeholder={placeholder} />
        : <input className={cls} value={value} onChange={onChange} placeholder={placeholder} />}
    </div>
  );
}

function NewPlanModal({ onClose, onCreate }: { onClose: () => void; onCreate: (m: PlanMeta) => void }) {
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<PlanMeta>({ name: "Untitled Test Plan", description: "", author: "", version: "1.0.0", dutName: "", dutSerial: "", dutModel: "", dutFirmware: "" });
  const upd = (k: keyof PlanMeta) => (e: any) => setMeta(m => ({ ...m, [k]: e.target.value }));
  const STEPS = ["Plan Details", "DUT Configuration", "Review"];

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[540px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FilePlus size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">New Test Plan</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex border-b border-border">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 py-2 text-center text-[11px] font-mono font-semibold uppercase tracking-wider border-b-2 transition-colors
              ${i === step ? "border-primary text-primary" : i < step ? "border-emerald-500 text-emerald-500" : "border-transparent text-muted-foreground"}`}>
              <span className="mr-1">{i < step ? "✓" : i + 1}.</span>{s}
            </div>
          ))}
        </div>
        <div className="px-5 py-5 space-y-4">
          {step === 0 && <>
            <Field label="Plan Name *" value={meta.name} onChange={upd("name")} placeholder="e.g. RF Board Validation v3" />
            <Field label="Description" value={meta.description} onChange={upd("description")} placeholder="What does this plan verify?" textarea />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Author" value={meta.author} onChange={upd("author")} placeholder="Engineer name" />
              <Field label="Version" value={meta.version} onChange={upd("version")} placeholder="1.0.0" />
            </div>
          </>}
          {step === 1 && <>
            <div className="text-[12px] text-muted-foreground font-mono mb-2">Configure the Device Under Test for traceability.</div>
            <Field label="DUT Name" value={meta.dutName} onChange={upd("dutName")} placeholder="e.g. RF Transceiver Module" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serial Number" value={meta.dutSerial} onChange={upd("dutSerial")} placeholder="SN-001234" />
              <Field label="Model" value={meta.dutModel} onChange={upd("dutModel")} placeholder="TRX-4820" />
            </div>
            <Field label="Firmware Version" value={meta.dutFirmware} onChange={upd("dutFirmware")} placeholder="v2.3.1" />
          </>}
          {step === 2 && (
            <div className="space-y-0">
              {[["Plan Name", meta.name], ["Author", meta.author || "—"], ["Version", meta.version],
                ["DUT Name", meta.dutName || "—"], ["DUT Serial", meta.dutSerial || "—"], ["DUT Model", meta.dutModel || "—"]
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-[12px] font-mono text-muted-foreground">{k}</span>
                  <span className="text-[12px] font-mono text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center px-5 py-3 border-t border-border bg-muted/20">
          <button onClick={onClose} className="text-[12px] text-muted-foreground hover:text-foreground font-mono">Cancel</button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 px-3 h-8 border border-border text-[12px] font-mono text-foreground hover:bg-secondary">
                <ChevronLeft size={12} /> Back
              </button>
            )}
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !meta.name.trim()}
                className="flex items-center gap-1 px-4 h-8 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-40">
                Next <ChevronRight size={12} />
              </button>
            ) : (
              <button onClick={() => onCreate(meta)} className="flex items-center gap-1 px-4 h-8 bg-emerald-600 text-white text-[12px] font-mono font-semibold hover:bg-emerald-600/90">
                <Check size={12} /> Create Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Step Modal ───────────────────────────────────────────────────────────

function AddStepModal({ library, onAdd, onClose }: { library: LibraryItem[]; onAdd: (i: LibraryItem) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...new Set(library.map(l => l.category))];
  const filtered = library.filter(l =>
    (cat === "All" || l.category === cat) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[620px] h-[480px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2"><Plus size={15} className="text-primary" /><span className="text-[13px] font-semibold text-foreground">Add Test Step</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-40 border-r border-border overflow-y-auto shrink-0">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`w-full text-left px-3 py-2 text-[12px] font-mono transition-colors border-l-2
                  ${cat === c ? "text-primary border-primary bg-primary/8" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 border border-border px-2 py-1.5 bg-background">
                <Search size={12} className="text-muted-foreground shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search steps..."
                  className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && <div className="py-8 text-center text-[12px] text-muted-foreground font-mono">No matching steps</div>}
              {filtered.map(item => (
                <button key={item.id} onClick={() => { onAdd(item); onClose(); }}
                  className="w-full text-left px-4 py-3 hover:bg-secondary group transition-colors border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[3px] h-5 shrink-0" style={{ background: TYPE_STRIPE[item.type] || "#64748b" }} />
                    <TypeIcon type={item.type} size={13} />
                    <span className="text-[13px] font-mono text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border px-1.5">
                      {TYPE_LABEL[item.type] || "—"}
                    </span>
                    {item.pluginId && <span className="text-[10px] font-mono text-primary border border-primary/30 px-1.5">plugin</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 pl-8">{item.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
          {filtered.length} steps · double-click or click to add
        </div>
      </div>
    </div>
  );
}

// ─── Plugin Manager ───────────────────────────────────────────────────────────

function PluginManager({ plugins, onInstall, onUpload, onClose }: {
  plugins: Plugin[]; onInstall: (id: string) => void; onUpload: (f: string) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"installed" | "browse" | "upload">("installed");
  const [uploadFile, setUploadFile] = useState("");
  const [uploading, setUploading] = useState(false);
  const installed = plugins.filter(p => p.status === "installed");
  const available = plugins.filter(p => p.status === "available");

  const handleUpload = () => {
    if (!uploadFile) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); onUpload(uploadFile); setUploadFile(""); }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card border border-border w-[660px] h-[520px] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2"><Package size={15} className="text-primary" /><span className="text-[13px] font-semibold text-foreground">Plugin Manager</span></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
        <div className="flex border-b border-border shrink-0">
          {(["installed", "browse", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 h-9 text-[12px] font-mono font-semibold uppercase tracking-wider border-b-2 transition-colors
                ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "installed" ? `Installed (${installed.length})` : t === "browse" ? `Available (${available.length})` : "Upload"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "installed" && (
            <div>
              {installed.length === 0 && <div className="py-12 text-center text-[12px] text-muted-foreground font-mono">No plugins installed</div>}
              {installed.map(p => (
                <div key={p.id} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                        <span className="text-[11px] font-mono text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 px-2">v{p.version}</span>
                        <span className="text-[11px] font-mono text-emerald-500">● installed</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{p.description}</div>
                      <div className="text-[11px] text-muted-foreground/60 font-mono">by {p.author} · {p.steps.length} steps</div>
                    </div>
                    <button className="text-[11px] font-mono text-muted-foreground hover:text-red-500 border border-border hover:border-red-500/30 px-2.5 py-1 transition-colors">Uninstall</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.steps.map(s => (
                      <span key={s.id} className="text-[11px] font-mono border border-border px-2 py-0.5 text-muted-foreground">{s.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "browse" && (
            <div>
              {available.map(p => (
                <div key={p.id} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{p.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">v{p.version}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{p.description}</div>
                      <div className="text-[11px] text-muted-foreground/60 font-mono">by {p.author} · {p.steps.length} steps</div>
                    </div>
                    <button onClick={() => onInstall(p.id)}
                      className="text-[11px] font-mono text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 px-3 py-1 flex items-center gap-1.5 transition-colors">
                      <Download size={11} /> Install
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.steps.map(s => <span key={s.id} className="text-[11px] font-mono border border-border px-2 py-0.5 text-muted-foreground">{s.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "upload" && (
            <div className="px-6 py-6 space-y-4">
              <div className="text-[12px] text-muted-foreground font-mono">Upload a <span className="text-primary">.tappackage</span> or <span className="text-primary">.dll</span> file to install a custom plugin.</div>
              <label className="block border-2 border-dashed border-border hover:border-primary/60 p-10 text-center cursor-pointer transition-colors group">
                <Upload size={28} className="mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <div className="text-[12px] font-mono text-muted-foreground">
                  {uploadFile ? <span className="text-primary">{uploadFile}</span> : <>Drop file or <span className="text-primary underline">browse</span></>}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-1">.tappackage, .dll supported</div>
                <input type="file" className="hidden" accept=".tappackage,.dll" onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0].name); }} />
              </label>
              {uploadFile && (
                <button onClick={handleUpload} disabled={uploading}
                  className="w-full h-9 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                  {uploading ? <><RefreshCw size={12} className="animate-spin" /> Installing...</> : <><Upload size={12} /> Install Package</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({ menu, onAction, onClose }: { menu: CtxMenu; onAction: (a: string, id: string) => void; onClose: () => void }) {
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

// ─── Window width hook ────────────────────────────────────────────────────────

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const winW = useWindowWidth();
  const isDesktop = winW >= 1280;
  const isLaptop = winW >= 1024;
  const isTablet = winW >= 768 && winW < 1024;

  const [plan, setPlan] = useState<TestStep[]>([]);
  const [planMeta, setPlanMeta] = useState<PlanMeta>({ name: "Untitled Test Plan", description: "", author: "", version: "1.0.0", dutName: "", dutSerial: "", dutModel: "", dutFirmware: "" });
  const [hasPlan, setHasPlan] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [leftTab, setLeftTab] = useState<"plan" | "library" | "plugins">("library");
  const [runState, setRunState] = useState<RunState>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(true);
  const [consoleFilter, setConsoleFilter] = useState<"ALL" | LogEntry["level"]>("ALL");
  const [libSearch, setLibSearch] = useState("");
  const [libFilterOpen, setLibFilterOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>(PRESET_PLUGINS);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [contextMenu, setContextMenu] = useState<CtxMenu | null>(null);
  const [addStepParentId, setAddStepParentId] = useState<string | null>(null);
  const [addStepIdx, setAddStepIdx] = useState<number | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);

  // Tablet panel states
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  // Panel sizes
  const [leftW, setLeftW] = useState(isDesktop ? 232 : 200);
  const [rightW, setRightW] = useState(isDesktop ? 280 : 248);
  const [consoleH, setConsoleH] = useState(176);

  const dragLeft = useDragResize("h", useCallback((d: number) => setLeftW(w => Math.max(140, Math.min(480, w + d))), []));
  const dragRight = useDragResize("h", useCallback((d: number) => setRightW(w => Math.max(180, Math.min(520, w - d))), []));
  const dragConsole = useDragResize("v", useCallback((d: number) => setConsoleH(h => Math.max(60, Math.min(500, h - d))), []));

  // Modals
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showPluginMgr, setShowPluginMgr] = useState(false);

  // Drag-from-library
  const [dragLibItem, setDragLibItem] = useState<LibraryItem | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);

  const logId = useRef(1);
  const logEndRef = useRef<HTMLDivElement>(null);
  const runTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { renameRef.current?.focus(); }, [renaming]);

  const addLog = useCallback((level: LogEntry["level"], source: string, message: string) => {
    setLogs(prev => [...prev, { id: logId.current++, timestamp: nowTs(), level, source, message }]);
  }, []);

  const library: LibraryItem[] = [
    ...BASE_LIBRARY,
    ...plugins.filter(p => p.status === "installed").flatMap(p => p.steps.map(s => ({ ...s, pluginId: p.id }))),
  ];
   const { data, isLoading, error } = useUsers();


  const selectedStep = selectedId ? flatAll(plan).find(s => s.id === selectedId) : null;
  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const stats = (() => {
    const all = flatAll(plan).filter(s => !s.children);
    return { total: all.length, passed: all.filter(s => s.status === "passed").length, failed: all.filter(s => s.status === "failed").length, enabled: all.filter(s => s.enabled).length };
  })();



  // ── Plan actions ──

  const handleCreatePlan = (meta: PlanMeta) => {
    setPlanMeta(meta); setPlan([]); setSelectedId(null); setExpanded(new Set());
    setRunState("idle"); setLogs([]); setHasPlan(true); setShowNewPlan(false); setLeftTab("library");
    addLog("INFO", "EdgeX", `Plan created: "${meta.name}"`);
    if (meta.dutName) addLog("INFO", "DUT", `DUT: ${meta.dutName} (${meta.dutSerial || "no SN"})`);
  };

  const handleAddGroup = () => {
    const seq = makeSequence();
    setPlan(prev => [...prev, seq]);
    setExpanded(ex => new Set([...ex, seq.id]));
    setSelectedId(seq.id);
    setLeftTab("plan");
    addLog("INFO", "Plan", `Added sequence: "${seq.name}"`);
  };

  const handleAddStep = (item: LibraryItem, parentId?: string | null, atIdx?: number) => {
    const step = makeStep(item);
    const pid = parentId !== undefined ? parentId : addStepParentId;
    const idx = atIdx !== undefined ? atIdx : addStepIdx;
    setPlan(prev => addToParent(prev, pid ?? null, step, idx));
    if (pid) setExpanded(ex => new Set([...ex, pid]));
    setSelectedId(step.id);
    setLeftTab("plan");
    addLog("INFO", "Plan", `Added: "${step.name}"`);
  };

  const handleContextAction = (action: string, stepId: string) => {
    const step = flatAll(plan).find(s => s.id === stepId);
    if (!step) return;
    if (action === "delete") { setPlan(prev => deleteIn(prev, stepId)); setSelectedId(null); addLog("INFO", "Plan", `Deleted: "${step.name}"`); }
    else if (action === "move_up") setPlan(prev => moveIn(prev, stepId, "up"));
    else if (action === "move_down") setPlan(prev => moveIn(prev, stepId, "down"));
    else if (action === "duplicate") {
      const clone: TestStep = { ...step, id: uid(), name: `${step.name} (copy)`, status: "pending", children: step.children?.map(c => ({ ...c, id: uid(), status: "pending" as StepStatus })) };
      setPlan(prev => addToParent(prev, null, clone));
      setSelectedId(clone.id);
    }
    else if (action === "rename") { setRenaming(stepId); setRenameVal(step.name); }
    else if (action === "toggle") setPlan(prev => updateIn(prev, stepId, s => ({ ...s, enabled: !s.enabled })));
    else if (action === "add_after") { setAddStepParentId(null); setShowAddStep(true); }
    else if (action === "add_child") { setAddStepParentId(stepId); setShowAddStep(true); }
    else if (action === "breakpoint") setPlan(prev => updateIn(prev, stepId, s => ({ ...s, breakpoint: !s.breakpoint })));
  };

  const commitRename = () => {
    if (renaming && renameVal.trim()) setPlan(prev => updateIn(prev, renaming, s => ({ ...s, name: renameVal.trim() })));
    setRenaming(null);
  };

  const updateProperty = (stepId: string, key: string, raw: string) => {
    setPlan(prev => updateIn(prev, stepId, s => ({
      ...s,
      properties: s.properties.map(p => {
        if (p.key !== key) return p;
        if (p.type === "number") return { ...p, value: parseFloat(raw) || 0 };
        if (p.type === "boolean") return { ...p, value: raw === "true" };
        if (p.type === "frequency") return { ...p, value: parseFreq(raw) };
        return { ...p, value: raw };
      }),
    })));
  };

  // ── Run engine ──

  const handleRun = () => {
    if (runState === "running" || plan.length === 0) return;
    runTimers.current.forEach(clearTimeout);
    setPlan(resetAll);
    setLogs([]);
    setRunState("running");
    const leaves = flatAll(plan).filter(s => !s.children && s.enabled);
    addLog("INFO", "EdgeX", `=== Run started — "${planMeta.name}" ===`);
    addLog("INFO", "EdgeX", `${leaves.length} enabled steps`);
    let offset = 0;
    leaves.forEach(step => {
      const start = offset + 200 + Math.random() * 150;
      const dur = 500 + Math.random() * 1500;
      offset = start + dur;
      runTimers.current.push(setTimeout(() => { setPlan(prev => setStatusIn(prev, step.id, "running")); addLog("INFO", step.type.toUpperCase(), `→ ${step.name}`); }, start));
      const verdict: StepStatus = Math.random() > 0.1 ? "passed" : "failed";
      runTimers.current.push(setTimeout(() => {
        setPlan(prev => setStatusIn(prev, step.id, verdict));
        addLog(verdict === "passed" ? "PASS" : "FAIL", step.type.toUpperCase(), `  ${step.name}: ${verdict.toUpperCase()} (${dur.toFixed(0)}ms)`);
        if (verdict === "failed") addLog("ERROR", step.type.toUpperCase(), `  ↳ Out-of-limits condition detected`);
      }, start + dur));
    });
    const tf = setTimeout(() => { setRunState("completed"); addLog("INFO", "EdgeX", `=== Run complete — ${(offset / 1000).toFixed(2)}s ===`); }, offset + 300);
    runTimers.current.push(tf);
  };

  const handleStop = () => { runTimers.current.forEach(clearTimeout); setRunState("idle"); addLog("WARN", "EdgeX", "Run aborted by user."); };
  const handlePause = () => {
    if (runState === "running") { setRunState("paused"); addLog("WARN", "EdgeX", "Run paused."); }
    else if (runState === "paused") { setRunState("running"); addLog("INFO", "EdgeX", "Run resumed."); }
  };
  const handleReset = () => {
    runTimers.current.forEach(clearTimeout);
    setRunState("idle");
    setPlan(resetAll);
    setLogs([{ id: logId.current++, timestamp: nowTs(), level: "INFO", source: "EdgeX", message: "Plan reset. Ready." }]);
  };

  const handleInstallPlugin = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: "installing" } : p));
    setTimeout(() => {
      setPlugins(prev => prev.map(p => p.id === id ? { ...p, status: "installed" } : p));
      const p = plugins.find(x => x.id === id);
      if (p) addLog("INFO", "Plugins", `Installed: ${p.name} v${p.version}`);
    }, 1500);
  };

  const handleUploadPlugin = (filename: string) => {
    const np: Plugin = {
      id: `up-${uid()}`, name: filename.replace(/\.(tappackage|dll)$/, ""),
      version: "1.0.0", author: "Custom", status: "installed",
      description: `Custom plugin from ${filename}`,
      steps: [{ id: `lup-${uid()}`, name: "Custom Step", category: "Custom", type: "flow", description: "Step from uploaded plugin", defaultProps: [{ key: "param1", label: "Parameter 1", type: "string", value: "", group: "Parameters" }] }],
    };
    setPlugins(prev => [...prev, np]);
    addLog("INFO", "Plugins", `Installed: ${filename}`);
    setShowPluginMgr(false);
  };

  const handleSave = () => {
    const blob = new Blob([JSON.stringify({ meta: planMeta, plan }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${planMeta.name.replace(/\s+/g, "_")}.edgex`; a.click();
    addLog("INFO", "FileIO", `Saved: ${planMeta.name}.edgex`);
  };

  // ── Drag from library ──
  const handleSeqDrop = (e: React.DragEvent, parentId: string | null, idx: number) => {
    e.preventDefault();
    if (dragLibItem) { handleAddStep(dragLibItem, parentId, idx); setDragLibItem(null); setDropIdx(null); }
  };

  // ── Tree render ──

  const renderTree = (step: TestStep, depth = 0): React.ReactNode => {
    const isSel = selectedId === step.id;
    const isExp = expanded.has(step.id);
    const hasKids = !!step.children?.length;
    const stripe = TYPE_STRIPE[step.type] || "#64748b";

    return (
      <div key={step.id}>
        {renaming === step.id ? (
          <div className="px-3 py-1" style={{ paddingLeft: 12 + depth * 14 }}>
            <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename} onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
              className="w-full bg-primary/10 border border-primary px-2 py-0.5 text-[12px] font-mono text-foreground outline-none" />
          </div>
        ) : (
          <div
            onClick={() => setSelectedId(step.id)}
            onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id }); setSelectedId(step.id); }}
            className={`flex items-center gap-1.5 py-1 cursor-pointer select-none group transition-colors
              ${isSel ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-secondary"}
              ${!step.enabled ? "opacity-40" : ""}`}
            style={{ paddingLeft: 10 + depth * 14, paddingRight: 8 }}
          >
            <button onClick={e => { e.stopPropagation(); if (hasKids) toggleExpand(step.id); }} className="w-3 shrink-0 text-muted-foreground">
              {hasKids ? (isExp ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : null}
            </button>
            <div className="w-[3px] h-3.5 shrink-0" style={{ background: stripe }} />
            {step.breakpoint && <span className="w-2 h-2 bg-red-500 shrink-0" />}
            {renaming === step.id ? null : (
              <span className={`flex-1 truncate text-[12px] font-mono ${isSel ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {step.name}
              </span>
            )}
            {!step.enabled && <EyeOff size={9} className="text-muted-foreground shrink-0" />}
            <StatusIcon status={step.status} size={11} />
          </div>
        )}
        {hasKids && isExp && step.children!.map(c => renderTree(c, depth + 1))}
      </div>
    );
  };

  // ── Sequence step render ──

  const renderSeqStep = (step: TestStep, parentId: string | null, idx: number): React.ReactNode => {
    const isSel = selectedId === step.id;
    const hasKids = !!step.children?.length;
    const isExp = expanded.has(step.id);
    const stripe = TYPE_STRIPE[step.type] || "#64748b";

    const summaryProp = step.properties.find(p => p.type === "frequency" || p.type === "number" || p.type === "string");
    const summary = summaryProp ? (summaryProp.type === "frequency" ? formatFreq(summaryProp.value as number) : `${summaryProp.value}${summaryProp.unit ? " " + summaryProp.unit : ""}`) : "";

    return (
      <div key={step.id}>
        {dragLibItem && (
          <div onDragOver={e => { e.preventDefault(); setDropIdx(idx); }} onDrop={e => handleSeqDrop(e, parentId, idx)}
            className={`h-1 transition-colors mx-1 mb-0.5 ${dropIdx === idx ? "bg-primary" : "bg-transparent"}`} />
        )}
        <div
          onClick={() => { setSelectedId(step.id); if (isTablet) setRightOpen(true); }}
          onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, stepId: step.id }); setSelectedId(step.id); }}
          className={`flex items-stretch border-b border-border cursor-pointer group transition-colors
            ${isSel ? "bg-primary/8" : "hover:bg-secondary/60"}
            ${step.status === "running" ? "bg-yellow-500/5" : ""}
            ${step.status === "passed" ? "bg-emerald-500/5" : ""}
            ${step.status === "failed" ? "bg-red-500/5" : ""}
            ${!step.enabled ? "opacity-40" : ""}`}
        >
          {/* Left type stripe */}
          <div className="w-[3px] shrink-0 transition-colors" style={{ background: isSel || step.status === "running" ? stripe : step.status === "passed" ? "#10b981" : step.status === "failed" ? "#ef4444" : stripe + "60" }} />

          {/* Content */}
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 min-w-0">
            {hasKids && (
              <button onClick={e => { e.stopPropagation(); toggleExpand(step.id); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                {isExp ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            )}
            <GripVertical size={12} className="text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 cursor-grab" />
            <TypeIcon type={step.type} size={13} />
            {step.breakpoint && <span className="w-2 h-2 bg-red-500 shrink-0" title="Breakpoint" />}

            {renaming === step.id ? (
              <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
                onBlur={commitRename} onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-primary/10 border border-primary px-1.5 py-0 text-[13px] font-mono text-foreground outline-none" />
            ) : (
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-mono truncate ${isSel ? "text-foreground font-medium" : "text-foreground/80 group-hover:text-foreground"}`}
                  onDoubleClick={e => { e.stopPropagation(); setRenaming(step.id); setRenameVal(step.name); }}>
                  {step.name}
                </div>
                {summary && <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{summary}</div>}
              </div>
            )}

            {/* Type label */}
            <span className="text-[10px] font-mono border px-1.5 py-0 shrink-0" style={{ color: stripe, borderColor: stripe + "50" }}>
              {TYPE_LABEL[step.type] || "—"}
            </span>

            {!step.enabled && <EyeOff size={11} className="text-muted-foreground shrink-0" />}
            {step.status !== "pending" && <StatusPill status={step.status} />}
            <StatusIcon status={step.status} size={13} />
          </div>

          {/* Hover actions */}
          <div className="hidden group-hover:flex items-center px-1.5 gap-0.5 border-l border-border/50 shrink-0">
            <button onClick={e => { e.stopPropagation(); setPlan(prev => moveIn(prev, step.id, "up")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowUp size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setPlan(prev => moveIn(prev, step.id, "down")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowDown size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setRenaming(step.id); setRenameVal(step.name); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><Edit3 size={11} /></button>
            <button onClick={e => { e.stopPropagation(); setPlan(prev => updateIn(prev, step.id, s => ({ ...s, enabled: !s.enabled }))); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary">{step.enabled ? <Eye size={11} /> : <EyeOff size={11} />}</button>
            <button onClick={e => { e.stopPropagation(); setPlan(prev => deleteIn(prev, step.id)); if (selectedId === step.id) setSelectedId(null); }} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 size={11} /></button>
          </div>
        </div>

        {/* Children */}
        {hasKids && isExp && (
          <div className="border-l-2 border-primary/20 ml-6">
            {step.children!.map((c, ci) => renderSeqStep(c, step.id, ci))}
            {dragLibItem && (
              <div onDragOver={e => { e.preventDefault(); setDropIdx(-1); }} onDrop={e => handleSeqDrop(e, step.id, step.children!.length)}
                className={`h-8 flex items-center justify-center text-[11px] font-mono border border-dashed transition-colors m-1
                  ${dropIdx === -1 ? "border-primary text-primary bg-primary/5" : "border-border/50 text-muted-foreground/40"}`}>
                + Drop into {step.name}
              </div>
            )}
            <button onClick={() => { setAddStepParentId(step.id); setAddStepIdx(undefined); setShowAddStep(true); }}
              className="w-full text-left px-4 py-1.5 text-[11px] font-mono text-muted-foreground/50 hover:text-primary hover:bg-primary/5 flex items-center gap-1.5 transition-colors border-b border-border/30">
              <Plus size={10} /> Add step inside {step.name}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Properties panel ──

  const renderProperties = () => {
    if (!selectedStep) return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Sliders size={24} className="opacity-20" />
        <span className="text-[12px] font-mono">Select a step to inspect</span>
      </div>
    );

    const groups = [...new Set(selectedStep.properties.map(p => p.group))];
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
              <span className="text-[11px] font-mono text-muted-foreground">{selectedStep.type.toUpperCase()}</span>
              {selectedStep.description && <span className="text-[11px] text-muted-foreground">· {selectedStep.description}</span>}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Enabled</span>
            <Toggle value={selectedStep.enabled} onChange={() => setPlan(prev => updateIn(prev, selectedStep.id, s => ({ ...s, enabled: !s.enabled })))} />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Breakpoint</span>
            <Toggle value={!!selectedStep.breakpoint} onChange={() => setPlan(prev => updateIn(prev, selectedStep.id, s => ({ ...s, breakpoint: !s.breakpoint })))} />
          </div>
        </div>

        {/* Properties by group */}
        {groups.map(group => (
          <div key={group}>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
              <div className="w-[3px] h-3" style={{ background: stripe }} />
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{group}</span>
            </div>
            {selectedStep.properties.filter(p => p.group === group).map(prop => (
              <div key={prop.key} className="px-3 py-2.5 border-b border-border/40">
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 uppercase tracking-wide">{prop.label}</label>
                {prop.type === "boolean" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-mono text-foreground">{prop.value ? "True" : "False"}</span>
                    <Toggle value={prop.value as boolean} onChange={() => updateProperty(selectedStep.id, prop.key, String(!prop.value))} />
                  </div>
                ) : prop.type === "enum" ? (
                  <select value={String(prop.value)} onChange={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                    className="w-full bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary">
                    {prop.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      key={`${selectedStep.id}-${prop.key}`}
                      defaultValue={prop.type === "frequency" ? formatFreq(prop.value as number) : String(prop.value)}
                      onBlur={e => updateProperty(selectedStep.id, prop.key, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="flex-1 bg-background border border-border px-2 py-1.5 text-[12px] font-mono text-foreground outline-none focus:border-primary min-w-0" />
                    {prop.unit && prop.type !== "frequency" && <span className="text-[11px] text-muted-foreground font-mono shrink-0">{prop.unit}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        {selectedStep.properties.length === 0 && <div className="px-3 py-4 text-[12px] text-muted-foreground font-mono">No configurable properties.</div>}

        <div className="px-3 py-3 border-t border-border flex gap-2 mt-1">
          <button onClick={() => { setAddStepParentId(null); setShowAddStep(true); }}
            className="flex-1 h-8 text-[12px] font-mono bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 border border-border transition-colors">
            <Plus size={11} /> Add Step
          </button>
          <button onClick={() => { if (selectedId) { setPlan(prev => deleteIn(prev, selectedId)); setSelectedId(null); } }}
            className="flex-1 h-8 text-[12px] font-mono text-red-500 hover:bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-1.5 transition-colors">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    );
  };

  const MENU_ITEMS: Record<string, string[]> = {
    File: ["New Test Plan", "Open...", "—", "Save", "Save As...", "Export Report...", "—", "Exit"],
    Edit: ["Undo", "Redo", "—", "Cut", "Copy", "Paste", "—", "Select All"],
    View: ["Test Plan Tree", "Step Library", "Properties", "Console", "—", "Reset Layout"],
    Run: ["Run All", "Run Selected", "—", "Pause", "Stop", "—", "Reset Plan"],
    Plugins: ["Plugin Manager", "—", "Reload Plugins"],
    Help: ["Documentation", "About EdgeX", "—", "Check for Updates"],
  };

  const runStatusStyle = runState === "running" ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/10 animate-pulse"
    : runState === "paused" ? "text-orange-500 border-orange-500/40 bg-orange-500/10"
    : runState === "completed" ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/10"
    : "text-muted-foreground border-border";

  const filteredLogs = consoleFilter === "ALL" ? logs : logs.filter(l => l.level === consoleFilter);
  const libCats = ["All", ...new Set(library.map(l => l.category))];
  const [libCat, setLibCat] = useState("All");
  const filteredLib = library.filter(l =>
    (libCat === "All" || l.category === libCat) &&
    (libSearch === "" || l.name.toLowerCase().includes(libSearch.toLowerCase()))
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      onClick={() => { setActiveMenu(null); setLibFilterOpen(false); }}>

      {/* ── Menu Bar ── */}
      <div className="flex items-center bg-card border-b-2 border-primary h-8 px-3 shrink-0 gap-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-5 shrink-0">
          <div className="w-[3px] h-5 bg-primary" />
          <span className="text-[14px] font-black tracking-[0.15em] font-mono">
            <span className="text-foreground">EDGE</span><span className="text-primary">X</span>
          </span>
          <span className="text-[10px] font-mono text-muted-foreground border border-border px-1.5 ml-0.5">v2.4</span>
        </div>

        {/* Menus */}
        {Object.keys(MENU_ITEMS).map(m => (
          <div key={m} className="relative">
            <button onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === m ? null : m); }}
              className={`px-3 h-8 text-[12px] font-medium transition-colors
                ${activeMenu === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
              {m}
            </button>
            {activeMenu === m && (
              <div className="absolute top-8 left-0 bg-popover border border-border shadow-2xl z-50 w-48 py-1" onClick={e => e.stopPropagation()}>
                {MENU_ITEMS[m].map((item, i) =>
                  item === "—" ? <div key={i} className="border-t border-border my-1" /> : (
                    <button key={item} onClick={() => {
                      setActiveMenu(null);
                      if (item === "New Test Plan") setShowNewPlan(true);
                      if (item === "Save") handleSave();
                      if (item === "Plugin Manager") setShowPluginMgr(true);
                      if (item === "Run All") handleRun();
                      if (item === "Stop") handleStop();
                      if (item === "Pause") handlePause();
                      if (item === "Reset Plan") handleReset();
                    }} className="w-full text-left px-4 py-2 text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      {item}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {hasPlan && (
            <div className="flex items-center gap-2 border-r border-border pr-3 mr-1">
              {planMeta.dutName && <span className="text-[11px] font-mono text-muted-foreground hidden lg:block">DUT: {planMeta.dutName}</span>}
              <span className="text-[11px] font-mono text-muted-foreground hidden md:block">{planMeta.name}</span>
            </div>
          )}
          <span className={`text-[11px] font-mono px-2 py-0.5 border font-semibold ${runStatusStyle}`}>{runState.toUpperCase()}</span>
          {/* Tablet panel toggles */}
          {isTablet && (
            <>
              <button onClick={() => setLeftOpen(v => !v)} className={`p-1.5 border transition-colors ${leftOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><PanelLeftOpen size={13} /></button>
              <button onClick={() => setRightOpen(v => !v)} className={`p-1.5 border transition-colors ${rightOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}><PanelRightOpen size={13} /></button>
            </>
          )}
          <button onClick={() => setIsDark(v => !v)} title={isDark ? "Light mode" : "Dark mode"}
            className="p-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center bg-card border-b border-border h-10 px-2 shrink-0 gap-1">
        {/* File group */}
        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={() => setShowNewPlan(true)} title="New Test Plan (Ctrl+N)"><FilePlus size={14} />{!isTablet && "New"}</ToolBtn>
          <ToolBtn onClick={() => {}} title="Open (Ctrl+O)"><FolderOpen size={14} />{!isTablet && "Open"}</ToolBtn>
          <ToolBtn onClick={handleSave} disabled={!hasPlan} title="Save (Ctrl+S)"><Save size={14} />{!isTablet && "Save"}</ToolBtn>
        </div>

        <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

        {/* Run group */}
        <div className="flex items-center gap-0.5">
          <ToolBtn variant="run" onClick={handleRun} disabled={runState === "running" || !hasPlan || plan.length === 0} title="Run (F5)">
            <Play size={13} fill="currentColor" /> Run
          </ToolBtn>
          <ToolBtn onClick={handlePause} disabled={runState === "idle" || runState === "completed"} active={runState === "paused"} title="Pause (F6)">
            <Pause size={13} />
          </ToolBtn>
          <ToolBtn variant="danger" onClick={handleStop} disabled={runState === "idle" || runState === "completed"} title="Stop (F7)">
            <Square size={13} fill="currentColor" />
          </ToolBtn>
          <ToolBtn onClick={handleReset} disabled={!hasPlan} title="Reset"><RotateCcw size={13} /></ToolBtn>
        </div>

        <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

        {/* Edit group */}
        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={handleAddGroup} disabled={!hasPlan} title="Add Sequence">
            <FolderPlus size={14} />{!isTablet && "Sequence"}
          </ToolBtn>
          <ToolBtn onClick={() => { setAddStepParentId(null); setAddStepIdx(undefined); setShowAddStep(true); }} disabled={!hasPlan} title="Add Step">
            <Plus size={14} />{!isTablet && "Step"}
          </ToolBtn>
        </div>

        <div className="w-px h-6 bg-border mx-1.5 shrink-0" />

        <ToolBtn onClick={() => setShowPluginMgr(true)} title="Plugin Manager">
          <Package size={14} />{!isTablet && "Plugins"}
        </ToolBtn>

        {/* Right stats */}
        <div className="ml-auto flex items-center gap-3 font-mono text-[12px] text-muted-foreground shrink-0">
          {hasPlan && (
            <>
              <span className="hidden md:block">{stats.total} steps</span>
              {stats.passed > 0 && <span className="text-emerald-500 font-semibold">{stats.passed} PASS</span>}
              {stats.failed > 0 && <span className="text-red-500 font-semibold">{stats.failed} FAIL</span>}
              {runState === "running" && <span className="text-yellow-500 font-semibold animate-pulse">● RUNNING</span>}
            </>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Left Panel ── */}
        {/* Tablet overlay */}
        {isTablet && leftOpen && (
          <div className="absolute inset-0 z-40" onClick={() => setLeftOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-2xl z-50" onClick={e => e.stopPropagation()}>
              {renderLeftPanel()}
            </div>
          </div>
        )}
        {/* Normal left panel */}
        {!isTablet && (
          <>
            <div className="shrink-0 flex flex-col border-r border-border bg-card overflow-hidden" style={{ width: leftW }}>
              {renderLeftPanel()}
            </div>
            <Splitter dir="h" onMouseDown={dragLeft} />
          </>
        )}

        {/* ── Center ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Center header */}
          <div className="flex items-center gap-2.5 px-4 h-9 border-b border-border bg-card shrink-0">
            <Layers size={14} className="text-primary shrink-0" />
            <span className="text-[12px] font-semibold text-foreground font-mono uppercase tracking-wider">Sequence Editor</span>
            {hasPlan && <>
              <span className="text-muted-foreground text-[12px] font-mono">—</span>
              <span className="text-[12px] text-muted-foreground font-mono truncate">{planMeta.name}</span>
            </>}
            {dragLibItem && <span className="ml-auto text-[11px] font-mono text-primary animate-pulse">⊕ Drop to add: {dragLibItem.name}</span>}
          </div>

          {/* Step list */}
          <div className="flex-1 overflow-y-auto"
            onDragOver={e => { if (dragLibItem) { e.preventDefault(); setDropIdx(plan.length); } }}
            onDrop={e => { if (dragLibItem) handleSeqDrop(e, null, plan.length); }}>
            {!hasPlan ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
                <div className="border-2 border-dashed border-border p-10 text-center w-full max-w-md">
                  <FilePlus size={40} className="mx-auto text-muted-foreground/20 mb-4" />
                  <div className="text-[14px] font-semibold text-foreground mb-1">No Test Plan Open</div>
                  <div className="text-[12px] text-muted-foreground font-mono mb-5">Create a new plan or open an existing one.</div>
                  <button onClick={() => setShowNewPlan(true)}
                    className="px-6 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 transition-colors">
                    Create New Test Plan
                  </button>
                </div>
              </div>
            ) : plan.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8"
                onDragOver={e => { if (dragLibItem) e.preventDefault(); }}
                onDrop={e => { if (dragLibItem) handleSeqDrop(e, null, 0); }}>
                <div className="border-2 border-dashed border-border p-10 text-center w-full max-w-md">
                  <Layers size={32} className="mx-auto text-muted-foreground/20 mb-4" />
                  <div className="text-[13px] text-muted-foreground font-mono mb-4">Plan is empty — add a sequence to begin</div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={handleAddGroup} className="px-4 py-2 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 flex items-center gap-2">
                      <FolderPlus size={13} /> Add Sequence
                    </button>
                    <button onClick={() => { setAddStepParentId(null); setShowAddStep(true); }} className="px-4 py-2 border border-border text-[12px] font-mono text-foreground hover:bg-secondary flex items-center gap-2">
                      <Plus size={13} /> Add Step
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {plan.map((s, i) => renderSeqStep(s, null, i))}
                {dragLibItem && (
                  <div onDragOver={e => { e.preventDefault(); setDropIdx(plan.length); }} onDrop={e => handleSeqDrop(e, null, plan.length)}
                    className={`h-12 flex items-center justify-center text-[12px] font-mono border border-dashed m-3 transition-colors
                      ${dropIdx === plan.length ? "border-primary text-primary bg-primary/5" : "border-border/40 text-muted-foreground/30"}`}>
                    + Drop here to append
                  </div>
                )}
                <button onClick={() => { setAddStepParentId(null); setAddStepIdx(plan.length); setShowAddStep(true); }}
                  className="w-full py-2 border-t border-dashed border-border/40 text-[12px] font-mono text-muted-foreground/50 hover:text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5 transition-colors">
                  <Plus size={11} /> Add Test Step
                </button>
              </div>
            )}
          </div>

          {/* Sequence status bar */}
          <div className="flex items-center gap-4 px-4 h-7 border-t border-border bg-card text-[11px] font-mono text-muted-foreground shrink-0">
            {hasPlan ? (
              <>
                <span>Steps: <span className="text-foreground">{stats.total}</span></span>
                <span>Enabled: <span className="text-foreground">{stats.enabled}</span></span>
                <span className="text-emerald-500">{stats.passed} Pass</span>
                <span className="text-red-500">{stats.failed} Fail</span>
                {planMeta.dutName && <span className="hidden lg:block ml-auto text-muted-foreground/60">DUT: {planMeta.dutName} {planMeta.dutSerial}</span>}
              </>
            ) : <span>No plan loaded</span>}
          </div>
        </div>

        {/* ── Right Panel ── */}
        {isTablet ? (
          rightOpen && (
            <div className="absolute inset-0 z-40" onClick={() => setRightOpen(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border flex flex-col shadow-2xl z-50" onClick={e => e.stopPropagation()}>
                <PanelHeader icon={<SlidersHorizontal size={13} />} label="Properties">
                  <button onClick={() => setRightOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
                </PanelHeader>
                <div className="flex-1 overflow-hidden">{renderProperties()}</div>
              </div>
            </div>
          )
        ) : (
          <>
            <Splitter dir="h" onMouseDown={dragRight} />
            <div className="shrink-0 flex flex-col border-l border-border bg-card overflow-hidden" style={{ width: rightW }}>
              <PanelHeader icon={<SlidersHorizontal size={13} />} label="Properties">
                {selectedStep && (
                  <>
                    <button onClick={() => { if (selectedId) setPlan(prev => moveIn(prev, selectedId, "up")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowUp size={11} /></button>
                    <button onClick={() => { if (selectedId) setPlan(prev => moveIn(prev, selectedId, "down")); }} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"><ArrowDown size={11} /></button>
                  </>
                )}
              </PanelHeader>
              <div className="flex-1 overflow-hidden">{renderProperties()}</div>
            </div>
          </>
        )}
      </div>

      {/* ── Console ── */}
      {showConsole && <Splitter dir="v" onMouseDown={dragConsole} />}
      <div className="border-t border-border bg-card shrink-0 flex flex-col" style={{ height: showConsole ? consoleH : 32 }}>
        {/* Console header */}
        <div className="flex items-center gap-2 px-3 h-8 border-b border-border shrink-0 bg-muted/20">
          <Terminal size={13} className="text-primary shrink-0" />
          <span className="text-[12px] font-semibold text-foreground font-mono uppercase tracking-wider">Console</span>
          {showConsole && (
            <div className="flex items-center gap-px ml-3">
              {(["ALL", "INFO", "DEBUG", "WARN", "ERROR", "PASS", "FAIL"] as const).map(lvl => (
                <button key={lvl} onClick={() => setConsoleFilter(lvl)}
                  className={`px-2 h-5 text-[10px] font-mono font-semibold uppercase transition-colors border-b-2
                    ${consoleFilter === lvl ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
                  {lvl}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground">{logs.length} lines</span>
            <button onClick={() => setLogs([])} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary" title="Clear"><X size={11} /></button>
            <button onClick={() => setShowConsole(v => !v)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary">
              {showConsole ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
        </div>

        {showConsole && (
          <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {filteredLogs.length === 0 && <div className="py-4 text-center text-[12px] text-muted-foreground font-mono">No log entries</div>}
            {filteredLogs.map(e => {
              const lvlColor = e.level === "PASS" ? "text-emerald-500" : e.level === "FAIL" || e.level === "ERROR" ? "text-red-500" : e.level === "WARN" ? "text-yellow-500" : e.level === "DEBUG" ? "text-muted-foreground/50" : "text-blue-400";
              return (
                <div key={e.id} className="flex items-baseline gap-3 px-3 py-[3px] hover:bg-secondary/30 border-b border-border/20 group">
                  <span className="text-[11px] text-muted-foreground/40 font-mono shrink-0 tabular-nums w-24">{e.timestamp}</span>
                  <span className={`text-[11px] font-mono font-bold shrink-0 w-9 ${lvlColor}`}>{e.level}</span>
                  <span className="text-[11px] text-muted-foreground/60 font-mono shrink-0 w-20 truncate">{e.source}</span>
                  <span className={`text-[12px] font-mono flex-1 ${e.level === "ERROR" || e.level === "FAIL" ? "text-red-400" : e.level === "PASS" ? "text-emerald-400" : e.level === "WARN" ? "text-yellow-400" : "text-foreground/70"}`}>
                    {e.message}
                  </span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewPlan && <NewPlanModal onClose={() => setShowNewPlan(false)} onCreate={handleCreatePlan} />}
      {showAddStep && <AddStepModal library={library} onClose={() => setShowAddStep(false)} onAdd={item => handleAddStep(item, addStepParentId, addStepIdx)} />}
      {showPluginMgr && <PluginManager plugins={plugins} onInstall={handleInstallPlugin} onUpload={handleUploadPlugin} onClose={() => setShowPluginMgr(false)} />}
      {contextMenu && <ContextMenu menu={contextMenu} onAction={handleContextAction} onClose={() => setContextMenu(null)} />}
    </div>
  );

  // ── Left panel renderer (shared for normal + tablet) ──

  function renderLeftPanel() {
    return (
      <>
        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {([["plan", "Plan", <List size={12} />], ["library", "Library", <Database size={12} />], ["plugins", "Plugins", <Package size={12} />]] as const).map(([t, lbl, icon]) => (
            <button key={t} onClick={() => setLeftTab(t as any)}
              className={`flex-1 h-9 text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors
                ${leftTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              {icon} {lbl}
            </button>
          ))}
        </div>

        {leftTab === "plan" && (
          <>
            <div className="flex items-center gap-1 px-3 h-8 border-b border-border shrink-0 bg-muted/20">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex-1">Test Plan Tree</span>
              <button onClick={() => setExpanded(new Set(flatAll(plan).map(s => s.id)))} className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-secondary">Expand</button>
              <button onClick={() => setExpanded(new Set())} className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-secondary">Collapse</button>
              {hasPlan && <button onClick={handleAddGroup} className="text-muted-foreground hover:text-primary p-0.5 hover:bg-secondary ml-1"><FolderPlus size={12} /></button>}
            </div>
            <div className="flex-1 overflow-y-auto">
              {!hasPlan ? (
                <div className="px-4 py-6 text-center">
                  <div className="text-[12px] text-muted-foreground font-mono mb-3">No plan open</div>
                  <button onClick={() => setShowNewPlan(true)} className="px-3 py-1.5 bg-primary text-primary-foreground text-[12px] font-mono hover:bg-primary/90">Create Plan</button>
                </div>
              ) : plan.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <div className="text-[12px] text-muted-foreground font-mono mb-2">Empty plan</div>
                  <button onClick={handleAddGroup} className="text-primary text-[12px] font-mono hover:underline">+ Add sequence</button>
                </div>
              ) : plan.map(s => renderTree(s))}
            </div>
          </>
        )}

        {leftTab === "library" && (
          <>
            <div className="flex items-center gap-2 px-2 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-1.5 bg-background flex-1">
                <Search size={11} className="text-muted-foreground shrink-0" />
                <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search library..."
                  className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
                {libSearch && <button onClick={() => setLibSearch("")} className="text-muted-foreground hover:text-foreground shrink-0"><X size={10} /></button>}
              </div>
              {/* Filter icon + dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setLibFilterOpen(v => !v); }}
                  className={`flex items-center justify-center w-8 h-8 border transition-colors
                    ${libCat !== "All" || libFilterOpen
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"}`}
                  style={libCat === "All" && !libFilterOpen ? {} : {}}
                  title="Filter by category"
                >
                  <Filter size={13} />
                </button>
                {libFilterOpen && (
                  <div className="absolute right-0 top-9 bg-popover border border-border shadow-xl z-50 w-44 py-1"
                    onClick={e => e.stopPropagation()}>
                    <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                      Filter by Category
                    </div>
                    {libCats.map(c => (
                      <button key={c} onClick={() => { setLibCat(c); setLibFilterOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-[12px] font-mono flex items-center justify-between transition-colors"
                        style={libCat === c
                          ? { background: "rgba(34,62,84,0.10)", color: "#223e54", borderLeft: "2px solid #223e54" }
                          : {}
                        }
                        onMouseEnter={e => { if (libCat !== c) (e.currentTarget as HTMLElement).style.background = "rgba(34,62,84,0.06)"; }}
                        onMouseLeave={e => { if (libCat !== c) (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <span className={libCat === c ? "font-semibold" : "text-muted-foreground"}>{c}</span>
                        {libCat === c && <Check size={11} style={{ color: "#223e54" }} />}
                      </button>
                    ))}
                    {libCat !== "All" && (
                      <div className="border-t border-border mt-1 pt-1">
                        <button onClick={() => { setLibCat("All"); setLibFilterOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(34,62,84,0.06)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                          Clear filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {libCat !== "All" && (
              <div className="px-3 py-1.5 border-b border-border flex items-center gap-2 shrink-0" style={{ background: "rgba(34,62,84,0.05)" }}>
                <span className="text-[11px] font-mono" style={{ color: "#223e54" }}>Filter: {libCat}</span>
                <button onClick={() => setLibCat("All")} className="ml-auto text-muted-foreground hover:text-foreground"><X size={10} /></button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {filteredLib.map(item => (
                <div key={item.id} draggable
                  onDragStart={() => setDragLibItem(item)}
                  onDragEnd={() => { setDragLibItem(null); setDropIdx(null); }}
                  onDoubleClick={() => {
                    if (!hasPlan) { setShowNewPlan(true); return; }
                    handleAddStep(item, selectedStep?.type === "sequence" ? selectedId : null);
                  }}
                  className="flex items-start gap-2.5 px-3 py-2.5 cursor-grab group border-b border-border/30 transition-colors"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(34,62,84,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <div className="w-[3px] h-4 mt-0.5 shrink-0" style={{ background: TYPE_STRIPE[item.type] || "#64748b" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-mono text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                      {item.pluginId && <span className="text-[9px] font-mono text-primary border border-primary/30 px-1 shrink-0">plugin</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{item.description}</div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground border border-border px-1 shrink-0 mt-0.5">{TYPE_LABEL[item.type]}</span>
                </div>
              ))}
            </div>
            <div className="px-3 h-7 border-t border-border flex items-center shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground">{filteredLib.length} steps</span>
              <span className="ml-auto text-[10px] font-mono text-primary/60">drag or double-click</span>
            </div>
          </>
        )}

        {leftTab === "plugins" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {plugins.map(p => (
                <div key={p.id} className="px-3 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-mono text-foreground font-medium">{p.name}</span>
                    <span className={`text-[10px] font-mono font-semibold ${p.status === "installed" ? "text-emerald-500" : p.status === "installing" ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`}>
                      {p.status === "installed" ? "● ACTIVE" : p.status === "installing" ? "● INSTALLING" : "○ AVAILABLE"}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">v{p.version} · {p.steps.length} steps</div>
                  {p.status === "available" && (
                    <button onClick={() => handleInstallPlugin(p.id)} className="mt-1.5 text-[11px] font-mono text-primary border border-primary/30 px-2 py-0.5 hover:bg-primary/10 flex items-center gap-1">
                      <Download size={10} /> Install
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-border">
              <button onClick={() => setShowPluginMgr(true)} className="w-full h-8 border border-border text-[12px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center gap-2 transition-colors">
                <Package size={12} /> Manage Plugins
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
}
