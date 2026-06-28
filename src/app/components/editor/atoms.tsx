import type { ReactNode } from "react";
import { Activity, AlertTriangle, BarChart2, CheckCircle2, Clock, Cpu, Layers, Minus, Radio, Wifi, XCircle, Zap } from "lucide-react";
import type { StepStatus } from "../../types/editor";
import { STATUS_COLOR, TYPE_STRIPE } from "../../constants/editor";

export function StatusIcon({ status, size = 13 }: { status: StepStatus; size?: number }) {
  const cls = `${STATUS_COLOR[status]} shrink-0`;
  if (status === "running") return <Activity size={size} className={`${cls} animate-pulse`} />;
  if (status === "passed") return <CheckCircle2 size={size} className={cls} />;
  if (status === "failed") return <XCircle size={size} className={cls} />;
  if (status === "error") return <AlertTriangle size={size} className={cls} />;
  if (status === "skipped") return <Minus size={size} className={cls} />;
  return <Clock size={size} className={`${cls} opacity-30`} />;
}

export function TypeIcon({ type, size = 13 }: { type: string; size?: number }) {
  const col = TYPE_STRIPE[type] || "#64748b";
  const p = { size, style: { color: col } };
  if (type === "sequence") return <Layers {...p} />;
  if (type === "rf") return <Radio {...p} />;
  if (type === "measure") return <BarChart2 {...p} />;
  if (type === "network") return <Wifi {...p} />;
  if (type === "dut") return <Cpu {...p} />;
  if (type === "hw") return <Cpu {...p} />;
  if (type === "instrument") return <Zap {...p} />;
  return <Clock {...p} />;
}

export function StatusPill({ status }: { status: StepStatus }) {
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

export function PanelHeader({ icon, label, children }: { icon: ReactNode; label: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-muted/40 shrink-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[12px] font-semibold text-foreground tracking-widest uppercase font-mono">{label}</span>
      {children && <div className="ml-auto flex items-center gap-1">{children}</div>}
    </div>
  );
}

export function ToolBtn({ onClick, disabled, title, children, active = false, variant = "ghost" }: any) {
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

export function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`w-9 h-5 relative transition-colors border ${value ? "bg-primary border-primary" : "bg-muted border-border"}`}>
      <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white transition-all ${value ? "left-[19px]" : "left-0.5"}`} />
    </button>
  );
}

