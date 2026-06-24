import { ChevronDown, ChevronUp, Terminal, X } from "lucide-react";
import { Splitter } from "./resizable";

interface ConsolePanelProps {
  showConsole: boolean;
  dragConsole: (event: React.MouseEvent) => void;
  consoleH: number;
  logs: any[];
  filteredLogs: any[];
  consoleFilter: string;
  setConsoleFilter: (value: any) => void;
  setLogs: (value: any[]) => void;
  setShowConsole: (updater: any) => void;
  logEndRef: React.RefObject<HTMLDivElement>;
}

export function ConsolePanel({
  showConsole,
  dragConsole,
  consoleH,
  logs,
  filteredLogs,
  consoleFilter,
  setConsoleFilter,
  setLogs,
  setShowConsole,
  logEndRef,
}: ConsolePanelProps) {
  return (
    <>
      {showConsole && <Splitter dir="v" onMouseDown={dragConsole} />}
      <div className="border-t border-border bg-card shrink-0 flex flex-col" style={{ height: showConsole ? consoleH : 32 }}>
        <div className="flex items-center gap-2 px-3 h-8 border-b border-border shrink-0 bg-muted/20">
          <Terminal size={13} className="text-primary shrink-0" />
          <span className="text-[12px] font-semibold text-foreground font-mono uppercase tracking-wider">Console</span>
          {showConsole && (
            <div className="flex items-center gap-px ml-3">
              {(["ALL", "INFO", "DEBUG", "WARN", "ERROR", "PASS", "FAIL"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setConsoleFilter(level)}
                  className={`px-2 h-5 text-[10px] font-mono font-semibold uppercase transition-colors border-b-2
                    ${consoleFilter === level ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
                >
                  {level}
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono text-muted-foreground">{logs.length} lines</span>
            <button onClick={() => setLogs([])} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary" title="Clear"><X size={11} /></button>
            <button onClick={() => setShowConsole((value: boolean) => !value)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary">
              {showConsole ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
        </div>

        {showConsole && (
          <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {filteredLogs.length === 0 && <div className="py-4 text-center text-[12px] text-muted-foreground font-mono">No log entries</div>}
            {filteredLogs.map(entry => {
              const levelColor = entry.level === "PASS" ? "text-emerald-500"
                : entry.level === "FAIL" || entry.level === "ERROR" ? "text-red-500"
                  : entry.level === "WARN" ? "text-yellow-500"
                    : entry.level === "DEBUG" ? "text-muted-foreground/50"
                      : "text-blue-400";
              const messageColor = entry.level === "ERROR" || entry.level === "FAIL" ? "text-red-400"
                : entry.level === "PASS" ? "text-emerald-400"
                  : entry.level === "WARN" ? "text-yellow-400"
                    : "text-foreground/70";

              return (
                <div key={entry.id} className="flex items-baseline gap-3 px-3 py-[3px] hover:bg-secondary/30 border-b border-border/20 group">
                  <span className="text-[11px] text-muted-foreground/40 font-mono shrink-0 tabular-nums w-24">{entry.timestamp}</span>
                  <span className={`text-[11px] font-mono font-bold shrink-0 w-9 ${levelColor}`}>{entry.level}</span>
                  <span className="text-[11px] text-muted-foreground/60 font-mono shrink-0 w-20 truncate">{entry.source}</span>
                  <span className={`text-[12px] font-mono flex-1 ${messageColor}`}>{entry.message}</span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </>
  );
}
