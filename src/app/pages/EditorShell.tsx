import { useMemo, useState } from "react";
import { Search, X, Clock } from "lucide-react";
import { ConsolePanel } from "../components/editor/ConsolePanel";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { MenuBar } from "../components/editor/MenuBar";
import { ModalsHost } from "../components/editor/ModalsHost";
import { PropertiesDock } from "../components/editor/PropertiesDock";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import { SequenceEditor } from "../components/editor/SequenceEditor";
import { Splitter } from "../components/editor/resizable";
import { useTestPlans } from "../hooks/usePlugin";

interface EditorShellProps {
  selectedId: any;
  leftTab: any;
  setLeftTab: any;
  expanded: any;
  setExpanded: any;
  renaming: any;
  renameRef: any;
  renameVal: any;
  setRenameVal: any;
  commitRename: any;
  setRenaming: any;
  setSelectedId: any;
  setContextMenu: any;
  toggleExpand: any;
  isTablet: any;
  setRightOpen: any;
  dragLibItem: any;
  dropIdx: any;
  setDropIdx: any;
  handleSeqDrop: any;
  setPlan: any;
  selectedStep: any;
  setAddStepParentId: any;
  setAddStepIdx: any;
  setShowAddStep: any;
  updateProperty: any;
  runState: any;
  logs: any;
  consoleFilter: any;
  setConsoleFilter: any;
  library: any;
  libSearch: any;
  setLibSearch: any;
  data: any;
  hasPlan: any;
  setShowNewPlan: any;
  handleAddStep: any;
  plugins: any;
  installedPlugins: any;
  isInstalledPluginsFetching: boolean;
  isAvailablePackagesFetching: boolean;
  handleInstallPlugin: any;
  handleUninstallPlugin: any;
  handleUninstallPackage: any;
  installedSearch: any;
  setInstalledSearch: any;
  browseSearch: any;
  setBrowseSearch: any;
  setShowPluginMgr: any;
  instruments: any[];
  isInstrumentsLoading: boolean;
  isInstrumentsError: boolean;
  duts: any[];
  isDutsLoading: boolean;
  isDutsError: boolean;
  plan: any;
  planMeta: any;
  stats: any;
  activeMenu: any;
  setActiveMenu: any;
  handleSave: any;
  handleRun: any;
  handleStop: any;
  handlePause: any;
  handleReset: any;
  leftOpen: any;
  setLeftOpen: any;
  rightOpen: any;
  isDark: any;
  setIsDark: any;
  handleAddGroup: any;
  leftW: any;
  dragLeft: any;
  rightW: any;
  dragRight: any;
  showConsole: any;
  dragConsole: any;
  consoleH: any;
  setLogs: any;
  setShowConsole: any;
  logEndRef: any;
  showNewPlan: any;
  handleCreatePlan: any;
  showAddStep: any;
  addStepParentId: any;
  addStepIdx: any;
  showPluginMgr: any;
  handleUploadPlugin: any;
  contextMenu: any;
  handleContextAction: any;
  setLibFilterOpen: any;
  libFilterOpen: any;
  setDragLibItem: any;
}

export function EditorShell(props: EditorShellProps) {
  const {
    selectedId,
    leftTab,
    setLeftTab,
    expanded,
    setExpanded,
    renaming,
    renameRef,
    renameVal,
    setRenameVal,
    commitRename,
    setRenaming,
    setSelectedId,
    setContextMenu,
    toggleExpand,
    isTablet,
    setRightOpen,
    dragLibItem,
    dropIdx,
    setDropIdx,
    handleSeqDrop,
    setPlan,
    selectedStep,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
    updateProperty,
    runState,
    logs,
    consoleFilter,
    setConsoleFilter,
    library,
    libSearch,
    setLibSearch,
    data,
    hasPlan,
    setShowNewPlan,
    handleAddStep,
    plugins,
    installedPlugins,
    isInstalledPluginsFetching,
    isAvailablePackagesFetching,
    handleInstallPlugin,
    handleUninstallPlugin,
    handleUninstallPackage,
    installedSearch,
    setInstalledSearch,
    browseSearch,
    setBrowseSearch,
    setShowPluginMgr,
    instruments,
    isInstrumentsLoading,
    isInstrumentsError,
    duts,
    isDutsLoading,
    isDutsError,
    plan,
    planMeta,
    stats,
    activeMenu,
    setActiveMenu,
    handleSave,
    handleRun,
    handleStop,
    handlePause,
    handleReset,
    leftOpen,
    setLeftOpen,
    rightOpen,
    isDark,
    setIsDark,
    handleAddGroup,
    leftW,
    dragLeft,
    rightW,
    dragRight,
    showConsole,
    dragConsole,
    consoleH,
    setLogs,
    setShowConsole,
    logEndRef,
    showNewPlan,
    handleCreatePlan,
    showAddStep,
    addStepParentId,
    addStepIdx,
    showPluginMgr,
    handleUploadPlugin,
    contextMenu,
    handleContextAction,
    setLibFilterOpen,
    libFilterOpen,
    setDragLibItem,
  } = props;
  const [libCat, setLibCat] = useState("All");
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [showInstrumentsPanel, setShowInstrumentsPanel] = useState(false);
  const [dutSearch, setDutSearch] = useState("");
  const [showDutsPanel, setShowDutsPanel] = useState(false);
  const [testPlanQuery, setTestPlanQuery] = useState("D:\\");
  const [showTestPlansPanel, setShowTestPlansPanel] = useState(false);
  const displayLibrary = data?.length ? data : library;

  const libCats = useMemo<string[]>(
    () => [
      "All",
      ...Array.from(
        new Set<string>(
          displayLibrary.map((item: any) => String(item.category))
        )
      ),
    ],
    [displayLibrary]
  );

  const filteredLib = useMemo(
    () => displayLibrary.filter((item: any) =>
      (libCat === "All" || item.category === libCat) &&
      (libSearch === "" || item.name.toLowerCase().includes(libSearch.toLowerCase()))
    ),
    [displayLibrary, libCat, libSearch]
  );

  const filteredInstruments = useMemo(
    () => instruments.filter((instrument: any) => {
      const search = instrumentSearch.trim().toLowerCase();
      if (!search) return true;
      return [instrument.name, instrument.baseType, instrument.assembly]
        .some(value => String(value ?? "").toLowerCase().includes(search));
    }),
    [instruments, instrumentSearch]
  );

  const filteredDuts = useMemo(
    () => duts.filter((dut: any) => {
      const search = dutSearch.trim().toLowerCase();
      if (!search) return true;
      return [dut.name, dut.serialNumber, dut.model, dut.firmware, dut.baseType, dut.assembly]
        .some(value => String(value ?? "").toLowerCase().includes(search));
    }),
    [duts, dutSearch]
  );

  const { data: testPlans = [], isLoading: isTestPlansLoading, isError: isTestPlansError } = useTestPlans(testPlanQuery.trim() || undefined);

  const filteredLogs = useMemo(
    () => consoleFilter === "ALL" ? logs : logs.filter((entry: any) => entry.level === consoleFilter),
    [consoleFilter, logs]
  );

  const instrumentToLibraryItem = (instrument: any) => ({
    id: `instrument:${instrument.name}:${instrument.assembly}`,
    name: instrument.name,
    category: "Instruments",
    type: "instrument",
    description: `Instrument from ${instrument.assembly}`,
    baseType: instrument.baseType,
    assembly: instrument.assembly,
    defaultProps: [
      { key: "instrumentName", label: "Instrument Name", type: "string", value: instrument.name, group: "Instrument" },
      { key: "baseType", label: "Base Type", type: "string", value: instrument.baseType, group: "Instrument" },
      { key: "assembly", label: "Assembly", type: "string", value: instrument.assembly, group: "Instrument" },
    ],
  });

  const propertiesPanel = (
    <PropertiesPanel
      selectedStep={selectedStep}
      selectedId={selectedId}
      plan={plan}
      instruments={instruments}
      testSteps={displayLibrary}
      setPlan={setPlan}
      setSelectedId={setSelectedId}
      setAddStepParentId={setAddStepParentId}
      setShowAddStep={setShowAddStep}
      updateProperty={updateProperty}
    />
  );

  const leftPanel = (
    <LeftPanel
      leftTab={leftTab}
      setLeftTab={setLeftTab}
      plan={plan}
      hasPlan={hasPlan}
      expanded={expanded}
      setExpanded={setExpanded}
      handleAddGroup={handleAddGroup}
      setShowNewPlan={setShowNewPlan}
      libSearch={libSearch}
      setLibSearch={setLibSearch}
      libCat={libCat}
      setLibCat={setLibCat}
      libCats={libCats}
      libFilterOpen={libFilterOpen}
      setLibFilterOpen={setLibFilterOpen}
      filteredLib={filteredLib}
      data={displayLibrary}
      instruments={filteredInstruments}
      instrumentSearch={instrumentSearch}
      setInstrumentSearch={setInstrumentSearch}
      isInstrumentsLoading={isInstrumentsLoading}
      isInstrumentsError={isInstrumentsError}
      setDragLibItem={setDragLibItem}
      setDropIdx={setDropIdx}
      handleAddStep={handleAddStep}
      selectedStep={selectedStep}
      selectedId={selectedId}
      plugins={plugins}
      handleInstallPlugin={handleInstallPlugin}
      setShowPluginMgr={setShowPluginMgr}
      renaming={renaming}
      renameRef={renameRef}
      renameVal={renameVal}
      setRenameVal={setRenameVal}
      commitRename={commitRename}
      setRenaming={setRenaming}
      setSelectedId={setSelectedId}
      setContextMenu={setContextMenu}
      toggleExpand={toggleExpand}
    />
  );

  const sequenceStepProps = {
    selectedId,
    expanded,
    renaming,
    renameRef,
    renameVal,
    setRenameVal,
    commitRename,
    setRenaming,
    setSelectedId,
    setContextMenu,
    toggleExpand,
    isTablet,
    setRightOpen,
    dragLibItem,
    dropIdx,
    setDropIdx,
    handleSeqDrop,
    setPlan,
    setAddStepParentId,
    setAddStepIdx,
    setShowAddStep,
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      onClick={() => {
        setActiveMenu(null);
        setLibFilterOpen(false);
      }}
    >
      <MenuBar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        hasPlan={hasPlan}
        planMeta={planMeta}
        runState={runState}
        isTablet={isTablet}
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        rightOpen={rightOpen}
        setRightOpen={setRightOpen}
        showConsole={showConsole}
        setShowConsole={setShowConsole}
        isDark={isDark}
        setIsDark={setIsDark}
        setShowNewPlan={setShowNewPlan}
        setShowPluginMgr={setShowPluginMgr}
        handleSave={handleSave}
        handleRun={handleRun}
        handleStop={handleStop}
        handlePause={handlePause}
        handleReset={handleReset}
      />

      <EditorToolbar
        isTablet={isTablet}
        hasPlan={hasPlan}
        plan={plan}
        stats={stats}
        runState={runState}
        setShowNewPlan={setShowNewPlan}
        setLeftTab={setLeftTab}
        setShowPluginMgr={setShowPluginMgr}
        setShowInstrumentsPanel={setShowInstrumentsPanel}
        setShowDutsPanel={setShowDutsPanel}
        setShowTestPlansPanel={setShowTestPlansPanel}
        setAddStepParentId={setAddStepParentId}
        setAddStepIdx={setAddStepIdx}
        setShowAddStep={setShowAddStep}
        handleSave={handleSave}
        handleRun={handleRun}
        handlePause={handlePause}
        handleStop={handleStop}
        handleReset={handleReset}
        handleAddGroup={handleAddGroup}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {isTablet && leftOpen && (
          <div className="absolute inset-0 z-40" onClick={() => setLeftOpen(false)}>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col shadow-2xl z-50" onClick={e => e.stopPropagation()}>
              {leftPanel}
            </div>
          </div>
        )}

        {!isTablet && leftOpen && (
          <>
            <div className="shrink-0 flex flex-col border-r border-border bg-card overflow-hidden" style={{ width: leftW }}>
              {leftPanel}
            </div>
            <Splitter dir="h" onMouseDown={dragLeft} />
          </>
        )}

        <SequenceEditor
          hasPlan={hasPlan}
          plan={plan}
          planMeta={planMeta}
          stats={stats}
          dragLibItem={dragLibItem}
          dropIdx={dropIdx}
          setDropIdx={setDropIdx}
          handleSeqDrop={handleSeqDrop}
          handleAddGroup={handleAddGroup}
          setShowNewPlan={setShowNewPlan}
          setAddStepParentId={setAddStepParentId}
          setAddStepIdx={setAddStepIdx}
          setShowAddStep={setShowAddStep}
          sequenceStepProps={sequenceStepProps}
        />

        {rightOpen && (
          <PropertiesDock
            isTablet={isTablet}
            rightOpen={rightOpen}
            setRightOpen={setRightOpen}
            selectedStep={selectedStep}
            selectedId={selectedId}
            setPlan={setPlan}
            rightW={rightW}
            dragRight={dragRight}
          >
            {propertiesPanel}
          </PropertiesDock>
        )}
      </div>

      {showInstrumentsPanel && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => { setShowInstrumentsPanel(false); setInstrumentSearch(""); }}>
          <div className="bg-card border border-border w-[660px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">Instruments</span>
              </div>
              <button onClick={() => { setShowInstrumentsPanel(false); setInstrumentSearch(""); }} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input value={instrumentSearch} onChange={e => setInstrumentSearch(e.target.value)} placeholder="Search instruments..." className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
                {instrumentSearch && <button onClick={() => setInstrumentSearch("")} className="text-muted-foreground hover:text-foreground shrink-0"><X size={10} /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isInstrumentsLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">Loading instruments...</div>
              ) : isInstrumentsError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">Unable to load instruments.</div>
              ) : filteredInstruments.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">{instrumentSearch ? "No matching instruments." : "No instruments available."}</div>
              ) : filteredInstruments.map(instrument => (
                <div key={`${instrument.name}:${instrument.assembly}`} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-foreground">{instrument.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">{instrument.baseType}</span>
                      </div>
                      <div className="text-[12px] text-muted-foreground mb-1">{instrument.assembly}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {filteredInstruments.length} instruments
            </div>
          </div>
        </div>
      )}

      {showDutsPanel && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => { setShowDutsPanel(false); setDutSearch(""); }}>
          <div className="bg-card border border-border w-[660px] max-w-[92vw] h-[520px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">DUTs</span>
              </div>
              <button onClick={() => { setShowDutsPanel(false); setDutSearch(""); }} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input value={dutSearch} onChange={e => setDutSearch(e.target.value)} placeholder="Search DUTs..." className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
                {dutSearch && <button onClick={() => setDutSearch("")} className="text-muted-foreground hover:text-foreground shrink-0"><X size={10} /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isDutsLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">Loading DUTs...</div>
              ) : isDutsError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">Unable to load DUTs.</div>
              ) : filteredDuts.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">{dutSearch ? "No matching DUTs." : "No DUTs available."}</div>
              ) : filteredDuts.map((dut: any, index: number) => (
                <div key={`${dut.name}:${dut.serialNumber}:${index}`} className="px-5 py-4 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[13px] font-semibold text-foreground">{dut.name || "Unnamed DUT"}</span>
                        {dut.baseType && <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">{dut.baseType}</span>}
                        {dut.model && <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">{dut.model}</span>}
                        {dut.serialNumber && <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">SN: {dut.serialNumber}</span>}
                      </div>
                      {dut.firmware && <div className="text-[12px] text-muted-foreground mb-1">Firmware: {dut.firmware}</div>}
                      {dut.assembly && <div className="text-[11px] text-muted-foreground/70 font-mono">{dut.assembly}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {filteredDuts.length} DUTs
            </div>
          </div>
        </div>
      )}

      {showTestPlansPanel && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={() => setShowTestPlansPanel(false)}>
          <div className="bg-card border border-border w-[760px] max-w-[92vw] h-[540px] max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-foreground">Test Plans</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {}} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-[12px] font-mono font-semibold hover:bg-primary/90 transition-colors">
                  <Clock size={12} /> History
                </button>
                <button onClick={() => setShowTestPlansPanel(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="px-3 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2 border border-border px-2.5 py-2 bg-background">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input value={testPlanQuery} onChange={e => setTestPlanQuery(e.target.value)} placeholder="Search test plans..." className="flex-1 bg-transparent text-[12px] font-mono text-foreground placeholder:text-muted-foreground outline-none" />
                {testPlanQuery && <button onClick={() => setTestPlanQuery("")} className="text-muted-foreground hover:text-foreground shrink-0"><X size={10} /></button>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isTestPlansLoading ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">Loading test plans...</div>
              ) : isTestPlansError ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-destructive">Unable to load test plans.</div>
              ) : testPlans.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] font-mono text-muted-foreground">No test plans found.</div>
              ) : testPlans.map((plan: any, index: number) => (
                <div key={`${plan.path}:${index}`} className="px-5 py-4 border-b border-border">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-foreground">{plan.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">{plan.stepCount} steps</span>
                      <span className="text-[11px] font-mono text-muted-foreground border border-border px-2">{new Date(plan.lastModified).toLocaleString()}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground break-all">{String(plan.path ?? "").replace(/\\/g, "\\\\")}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground font-mono">
              {testPlans.length} test plans
            </div>
          </div>
        </div>
      )}

      {showConsole && (
        <ConsolePanel
          showConsole={showConsole}
          dragConsole={dragConsole}
          consoleH={consoleH}
          logs={logs}
          filteredLogs={filteredLogs}
          consoleFilter={consoleFilter}
          setConsoleFilter={setConsoleFilter}
          setLogs={setLogs}
          setShowConsole={setShowConsole}
          logEndRef={logEndRef}
        />
      )}

      <ModalsHost
        showNewPlan={showNewPlan}
        setShowNewPlan={setShowNewPlan}
        handleCreatePlan={handleCreatePlan}
        showAddStep={showAddStep}
        setShowAddStep={setShowAddStep}
        library={library}
        handleAddStep={handleAddStep}
        addStepParentId={addStepParentId}
        addStepIdx={addStepIdx}
        instruments={instruments}
        duts={duts}
        showPluginMgr={showPluginMgr}
        setShowPluginMgr={setShowPluginMgr}
        plugins={plugins}
        installedPlugins={installedPlugins}
        isInstalledLoading={isInstalledPluginsFetching}
        isAvailableLoading={isAvailablePackagesFetching}
        handleInstallPlugin={handleInstallPlugin}
        handleUninstallPlugin={handleUninstallPlugin}
        handleUninstallPackage={handleUninstallPackage}
        handleUploadPlugin={handleUploadPlugin}
        installedSearch={installedSearch}
        setInstalledSearch={setInstalledSearch}
        browseSearch={browseSearch}
        setBrowseSearch={setBrowseSearch}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        handleContextAction={handleContextAction}
      />
    </div>
  );
}