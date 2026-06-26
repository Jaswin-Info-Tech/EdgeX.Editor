import { useMemo, useState } from "react";
import { ConsolePanel } from "../components/editor/ConsolePanel";
import { EditorToolbar } from "../components/editor/EditorToolbar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { MenuBar } from "../components/editor/MenuBar";
import { ModalsHost } from "../components/editor/ModalsHost";
import { PropertiesDock } from "../components/editor/PropertiesDock";
import { PropertiesPanel } from "../components/editor/PropertiesPanel";
import { SequenceEditor } from "../components/editor/SequenceEditor";
import { Splitter } from "../components/editor/resizable";

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
  handleInstallPlugin: any;
  setShowPluginMgr: any;
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
    handleInstallPlugin,
    setShowPluginMgr,
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

  const filteredLogs = useMemo(
    () => consoleFilter === "ALL" ? logs : logs.filter((entry: any) => entry.level === consoleFilter),
    [consoleFilter, logs]
  );

  const propertiesPanel = (
    <PropertiesPanel
      selectedStep={selectedStep}
      selectedId={selectedId}
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
        setShowPluginMgr={setShowPluginMgr}
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
        showPluginMgr={showPluginMgr}
        setShowPluginMgr={setShowPluginMgr}
        plugins={plugins}
        handleInstallPlugin={handleInstallPlugin}
        handleUploadPlugin={handleUploadPlugin}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        handleContextAction={handleContextAction}
      />
    </div>
  );
}
