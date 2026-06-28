import type { StepStatus } from "../types/editor";

export const TYPE_STRIPE: Record<string, string> = {
  sequence: "#3b82f6", rf: "#a855f7", measure: "#10b981",
  network: "#06b6d4", hw: "#f97316", instrument: "#eab308", dut: "#22c55e", flow: "#64748b",
};

export const TYPE_LABEL: Record<string, string> = {
  sequence: "SEQ", rf: "RF", measure: "MSR", network: "NET",
  hw: "HW", instrument: "INST", dut: "DUT", flow: "FLOW",
};

export const STATUS_COLOR: Record<StepStatus, string> = {
  pending: "text-muted-foreground", running: "text-yellow-500",
  passed: "text-emerald-500", failed: "text-red-500",
  skipped: "text-muted-foreground", error: "text-red-600",
};

export const STATUS_BG: Record<StepStatus, string> = {
  pending: "", running: "bg-yellow-500/5 border-l-yellow-500/60",
  passed: "bg-emerald-500/5 border-l-emerald-500/40",
  failed: "bg-red-500/5 border-l-red-500/40",
  skipped: "opacity-50", error: "bg-red-600/5 border-l-red-600/40",
};
