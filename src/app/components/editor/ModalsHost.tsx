import { AddStepModal, ContextMenu, NewPlanModal, PluginManager } from "./modals";

interface ModalsHostProps {
  showNewPlan: boolean;
  setShowNewPlan: (value: boolean) => void;
  handleCreatePlan: (value: any) => void;
  showAddStep: boolean;
  setShowAddStep: (value: boolean) => void;
  library: any[];
  handleAddStep: (item: any, parentId?: string | null, atIdx?: number) => void;
  addStepParentId: string | null;
  addStepIdx: number | undefined;
  instruments: any[];
  duts: any[];
  showPluginMgr: boolean;
  setShowPluginMgr: (value: boolean) => void;
  plugins: any[];
  handleInstallPlugin: (id: string) => void;
  handleUploadPlugin: (file: File) => Promise<void> | void;
  contextMenu: any;
  setContextMenu: (value: any) => void;
  handleContextAction: (action: string, stepId: string) => void;
}

export function ModalsHost({
  showNewPlan,
  setShowNewPlan,
  handleCreatePlan,
  showAddStep,
  setShowAddStep,
  library,
  handleAddStep,
  addStepParentId,
  addStepIdx,
  instruments,
  duts,
  showPluginMgr,
  setShowPluginMgr,
  plugins,
  handleInstallPlugin,
  handleUploadPlugin,
  contextMenu,
  setContextMenu,
  handleContextAction,
}: ModalsHostProps)
{
  // console.log(plugins,"kkkkkk") 
  return (
    <>
      {showNewPlan && (
        <NewPlanModal
          onClose={() => setShowNewPlan(false)}
          onCreate={handleCreatePlan}
        />
      )}
      {showAddStep && (
        <AddStepModal
          library={library}
          instruments={instruments}
          duts={duts}
          onClose={() => setShowAddStep(false)}
          onAdd={item => handleAddStep(item, addStepParentId, addStepIdx)}
        />
      )}
      {showPluginMgr && (
        <PluginManager
          plugins={plugins}
          onInstall={handleInstallPlugin}
          onUpload={handleUploadPlugin}
          onClose={() => setShowPluginMgr(false)}
        />
      )}
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onAction={handleContextAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
