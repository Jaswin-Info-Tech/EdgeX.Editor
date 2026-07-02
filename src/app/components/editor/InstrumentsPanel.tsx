import { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Cable,
  Clock3,
  Cpu,
  DatabaseZap,
  Gauge,
  Search,
  Thermometer,
  Wifi,
  X,
  Zap,
} from "lucide-react";

interface InstrumentsPanelProps {
  instruments: any[];
  search: string;
  setSearch: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
}

const fieldCls =
  "h-9 w-full bg-background border border-border px-3 text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

const labelCls =
  "block text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

const getInstrumentIcon = (instrument: any) => {
  return <Cable size={15} className="text-primary shrink-0" />;
};

const getDefaultName = (instrument: any) =>
  instrument?.name ? `${instrument.name} 1` : "";

export function InstrumentsPanel({
  instruments,
  search,
  setSearch,
  isLoading,
  isError,
  onClose,
}: InstrumentsPanelProps) {
  const [selectedKey, setSelectedKey] = useState("");
  const [instrumentName, setInstrumentName] = useState("");
  const [visaAddress, setVisaAddress] = useState("GPIB0::13::INSTR");
  const [voltageRange, setVoltageRange] = useState("60");
  const [currentRange, setCurrentRange] = useState("10");
  const [measurementInterval, setMeasurementInterval] = useState("100");
  const [interfaceType, setInterfaceType] = useState("GPIB");

  const selectedInstrument = useMemo(
    () =>
      instruments.find(
        (instrument) => `${instrument.name}:${instrument.assembly}` === selectedKey,
      ) ?? instruments[0],
    [instruments, selectedKey],
  );

  useEffect(() => {
    if (!selectedInstrument) {
      setSelectedKey("");
      setInstrumentName("");
      return;
    }

    const key = `${selectedInstrument.name}:${selectedInstrument.assembly}`;
    if (selectedKey !== key) setSelectedKey(key);
    setInstrumentName(getDefaultName(selectedInstrument));
  }, [selectedInstrument?.name, selectedInstrument?.assembly]);

  const closePanel = () => {
    onClose();
    setSearch("");
  };

  const selectInstrument = (instrument: any) => {
    setSelectedKey(`${instrument.name}:${instrument.assembly}`);
    setInstrumentName(getDefaultName(instrument));
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      onClick={closePanel}
    >
      <div
        className="bg-card border border-border w-[720px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 items-center justify-between border-b border-border bg-muted/30 px-4">
          <div className="flex items-center gap-2">
            <DatabaseZap size={15} className="text-primary" />
            <span className="text-[13px] font-semibold text-foreground">
              Add Instrument
            </span>
          </div>
          <button
            onClick={closePanel}
            className="text-muted-foreground hover:text-foreground"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[210px] shrink-0 flex-col border-r border-border bg-muted/10">
            <div className="border-b border-border p-3">
              <div className="flex h-8 items-center gap-2 border border-border bg-background px-2">
                <Search size={12} className="shrink-0 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="min-w-0 flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  Loading instruments...
                </div>
              ) : isError ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-destructive">
                  Unable to load instruments.
                </div>
              ) : instruments.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] font-mono text-muted-foreground">
                  {search ? "No matching instruments." : "No instruments available."}
                </div>
              ) : (
                instruments.map((instrument) => {
                  const key = `${instrument.name}:${instrument.assembly}`;
                  const isSelected = key === selectedKey;

                  return (
                    <button
                      key={key}
                      onClick={() => selectInstrument(instrument)}
                      className={`flex w-full items-center gap-2 border-b border-border/60 px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      {getInstrumentIcon(instrument)}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                        {instrument.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-card">
            <div className="border-b border-border px-5 py-4">
              {selectedInstrument ? (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getInstrumentIcon(selectedInstrument)}</div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-foreground">
                      {selectedInstrument.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {selectedInstrument.baseType || "Precision measurement instrument"}
                    </div>
                    {selectedInstrument.assembly && (
                      <div className="mt-1 truncate text-[10px] font-mono text-muted-foreground/70">
                        {selectedInstrument.assembly}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[12px] font-mono text-muted-foreground">
                  Select an instrument type.
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Instrument Name</label>
                  <input
                    value={instrumentName}
                    onChange={(e) => setInstrumentName(e.target.value)}
                    placeholder="Instrument name"
                    className={fieldCls}
                    disabled={!selectedInstrument}
                  />
                </div>

                <div>
                  <div className="mb-3 border-t border-border pt-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Default Parameters
                  </div>
                  <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                    <label className="text-[11px] font-mono text-muted-foreground">
                      VISA Address
                    </label>
                    <input
                      value={visaAddress}
                      onChange={(e) => setVisaAddress(e.target.value)}
                      className={fieldCls}
                      disabled={!selectedInstrument}
                    />

                    <label className="text-[11px] font-mono text-muted-foreground">
                      Voltage Range (V)
                    </label>
                    <input
                      value={voltageRange}
                      onChange={(e) => setVoltageRange(e.target.value)}
                      className={fieldCls}
                      disabled={!selectedInstrument}
                    />

                    <label className="text-[11px] font-mono text-muted-foreground">
                      Current Range (A)
                    </label>
                    <input
                      value={currentRange}
                      onChange={(e) => setCurrentRange(e.target.value)}
                      className={fieldCls}
                      disabled={!selectedInstrument}
                    />

                    <label className="text-[11px] font-mono text-muted-foreground">
                      Measurement Interval (ms)
                    </label>
                    <input
                      value={measurementInterval}
                      onChange={(e) => setMeasurementInterval(e.target.value)}
                      className={fieldCls}
                      disabled={!selectedInstrument}
                    />

                    <label className="text-[11px] font-mono text-muted-foreground">
                      Interface
                    </label>
                    <select
                      value={interfaceType}
                      onChange={(e) => setInterfaceType(e.target.value)}
                      className={fieldCls}
                      disabled={!selectedInstrument}
                    >
                      <option>GPIB</option>
                      <option>USB</option>
                      <option>LAN</option>
                      <option>Serial</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex h-12 items-center border-t border-border bg-muted/20 px-4">
          <span className="text-[11px] font-mono text-muted-foreground">
            Will be added to the Instruments panel
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={closePanel}
              className="h-8 px-4 border border-border text-[12px] font-mono font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={closePanel}
              disabled={!selectedInstrument || !instrumentName.trim()}
              className="flex h-8 items-center gap-2 bg-primary px-4 text-[12px] font-mono font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap size={12} />
              Add Instrument
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
