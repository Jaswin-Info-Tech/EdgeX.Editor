import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ChartNoAxesCombined,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSystemKpis } from "../../hooks/useSystem";

type HistoryPoint = {
  time: string;
  cpu: number;
  memoryUsedMb: number;
  processWsMb: number;
  managedHeapMb: number;
};

interface SystemKpisPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const HISTORY_LIMIT = 24;

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const formatTimestamp = (timestampUtc: string) => {
  const value = new Date(timestampUtc);
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const toMb = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 100) / 100;

const KpiTile = ({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: JSX.Element;
}) => (
  <div className="border border-border bg-card/80 px-4 py-3">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
      <span>{title}</span>
      <span>{icon}</span>
    </div>
    <div className="mt-2 text-[24px] leading-none font-semibold text-foreground font-mono">{value}</div>
    <div className="mt-1 text-[11px] text-muted-foreground font-mono">{hint}</div>
  </div>
);

export function SystemKpisPanel({ isVisible, onClose }: SystemKpisPanelProps) {
  const { data, isLoading, isFetching, isError, error, refetch } = useSystemKpis(isVisible);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (!data) return;
    const nextPoint: HistoryPoint = {
      time: formatTimestamp(data.timestampUtc),
      cpu: data.cpu.usagePercent ?? 0,
      memoryUsedMb: data.memory.usedMb,
      processWsMb: data.process.workingSetMb,
      managedHeapMb: toMb(data.process.managedHeapBytes),
    };

    setHistory((prev) => {
      const next = [...prev, nextPoint];
      if (next.length > HISTORY_LIMIT) return next.slice(next.length - HISTORY_LIMIT);
      return next;
    });
  }, [data]);

  const memoryUsagePercent = useMemo(() => {
    if (!data || data.memory.totalMb <= 0) return 0;
    return (data.memory.usedMb / data.memory.totalMb) * 100;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-background py-4">
        <div className="border border-border bg-card p-6 text-sm font-mono text-muted-foreground">Loading system KPIs...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 overflow-auto bg-background py-4">
        <div className="border border-destructive/40 bg-destructive/10 p-6 text-sm font-mono text-destructive">
          <div className="font-semibold">Unable to load system KPIs.</div>
          <div className="mt-2 text-[12px] opacity-90">{error instanceof Error ? error.message : "Unknown error"}</div>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-2 border border-destructive/50 px-3 py-1.5 text-[12px] font-semibold hover:bg-destructive/20"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-background py-4">
      <div className="flex w-full flex-col gap-4">
        <div className="border border-border bg-card px-4 py-3 md:px-5 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono">System Monitoring</div>
              <div className="mt-1 text-[18px] font-semibold text-foreground font-mono">{data.machineName}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[11px] text-muted-foreground">{data.osDescription} ({data.osArchitecture})</div>
              <div className="text-[11px] text-muted-foreground">
                Last sample: {formatTimestamp(data.timestampUtc)} {isFetching ? "(refreshing...)" : ""}
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-[12px] font-mono font-semibold text-foreground hover:bg-secondary"
            >
              <ArrowLeft size={12} /> Back To Editor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            title="CPU Usage"
            value={data.cpu.usagePercent == null ? "Warming" : `${data.cpu.usagePercent.toFixed(1)}%`}
            hint={data.cpu.message ?? `${data.processorCount} cores`}
            icon={<Cpu size={14} />}
          />
          <KpiTile
            title="Memory Used"
            value={`${data.memory.usedMb.toFixed(0)} MB`}
            hint={`${memoryUsagePercent.toFixed(1)}% of ${data.memory.totalMb.toFixed(0)} MB`}
            icon={<MemoryStick size={14} />}
          />
          <KpiTile
            title="Process Working Set"
            value={`${data.process.workingSetMb.toFixed(2)} MB`}
            hint={`Private ${data.process.privateMemoryMb.toFixed(2)} MB`}
            icon={<HardDrive size={14} />}
          />
          <KpiTile
            title="Uptime"
            value={formatUptime(data.uptimeSeconds)}
            hint={`PID ${data.process.id} | Threads ${data.process.threads}`}
            icon={<Server size={14} />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-foreground font-mono uppercase">
              <Activity size={14} /> CPU Trend
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 3" stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip formatter={(value: number) => `${Number(value).toFixed(1)}%`} />
                  <Line
                    type="monotone"
                    dataKey="cpu"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-foreground font-mono uppercase">
              <ChartNoAxesCombined size={14} /> Memory Trend
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 3" stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `${Number(value).toFixed(1)} MB`} />
                  <Area
                    type="monotone"
                    dataKey="memoryUsedMb"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.25}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="processWsMb"
                    stroke="var(--color-chart-3)"
                    fill="var(--color-chart-3)"
                    fillOpacity={0.22}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
              <span>System used memory</span>
              <span>Process working set</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            title="Managed Heap"
            value={`${toMb(data.process.managedHeapBytes).toFixed(2)} MB`}
            hint={`Heap size ${toMb(data.process.heapSizeBytes).toFixed(2)} MB`}
            icon={<MemoryStick size={14} />}
          />
          <KpiTile
            title="Fragmented Heap"
            value={`${toMb(data.process.fragmentedBytes).toFixed(2)} MB`}
            hint="Managed memory fragmentation"
            icon={<MemoryStick size={14} />}
          />
          <KpiTile
            title="CPU Time"
            value={`${data.process.cpuTimeSeconds.toFixed(2)} s`}
            hint={`${data.process.name} (${data.processArchitecture})`}
            icon={<Cpu size={14} />}
          />
          <KpiTile
            title="Available Memory"
            value={`${data.memory.availableMb.toFixed(0)} MB`}
            hint={`${toMb(data.process.totalAvailableMemoryBytes).toFixed(0)} MB allocatable`}
            icon={<HardDrive size={14} />}
          />
        </div>
      </div>
    </div>
  );
}
