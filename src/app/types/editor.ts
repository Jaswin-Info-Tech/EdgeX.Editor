export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped" | "error";
export type RunState = "idle" | "running" | "paused" | "completed";

export interface Property {
  key: string; label: string;
  type: "string" | "number" | "boolean" | "enum" | "frequency";
  value: string | number | boolean; unit?: string; options?: string[]; group: string;
}

export interface TestStep {
  id: string; name: string; type: string; status: StepStatus;
  children?: TestStep[]; enabled: boolean; properties: Property[];
  description?: string; breakpoint?: boolean;
}

export interface LogEntry {
  id: number; timestamp: string;
  level: "INFO" | "DEBUG" | "WARN" | "ERROR" | "PASS" | "FAIL";
  source: string; message: string;
}

export interface LibraryItem {
  id: string; name: string; category: string; description: string; type: string; pluginId?: string;
  baseType?: string;
  assembly?: string;
  defaultProps: Property[];
}

export interface InstrumentItem {
  name: string;
  assembly: string;
  baseType: string;
  canCreateInstance: boolean;
  isBrowsable: boolean;
}

export interface Plugin {
  id: string; name: string; version: string; author: string; description: string;
  state: "installed" | "installing" | "available"; steps?: LibraryItem[];
}

export interface PlanMeta {
  name: string; description: string; author: string; version: string;
  dutName: string; dutSerial: string; dutModel: string; dutFirmware: string;
}

export interface CtxMenu { x: number; y: number; stepId: string; }
