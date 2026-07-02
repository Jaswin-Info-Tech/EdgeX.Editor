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
  connections: any[];
  showPluginMgr: boolean;
  setShowPluginMgr: (value: boolean) => void;
  plugins: any[];
  installedPlugins: any[];
  isInstalledLoading: boolean;
  isAvailableLoading: boolean;
  handleInstallPlugin: (id: string) => Promise<void>;
  handleUninstallPlugin: (id: string) => Promise<void>;
  handleUninstallPackage: (id: string) => Promise<void>;
  handleUploadPlugin: (file: File) => Promise<void>;
   installedSearch: string;
  setInstalledSearch: (value: string) => void;
  browseSearch: string;
  setBrowseSearch: (value: string) => void;
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
  showPluginMgr,
  setShowPluginMgr,
  plugins,
  installedPlugins,
  isInstalledLoading,
  isAvailableLoading,
  handleInstallPlugin,
  handleUninstallPlugin,
  handleUninstallPackage,
  handleUploadPlugin,
  installedSearch,
  setInstalledSearch,
  browseSearch,
  setBrowseSearch,
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
          onClose={() => setShowAddStep(false)}
          onAdd={item => handleAddStep(item, addStepParentId, addStepIdx)}
        />
      )}
      {showPluginMgr && (
        <PluginManager
          plugins={plugins}
          installedPlugins={installedPlugins}
          isInstalledLoading={isInstalledLoading}
          isAvailableLoading={isAvailableLoading}
          onInstall={handleInstallPlugin}
          onUninstall={handleUninstallPlugin}
          onUninstallPackage={handleUninstallPackage}
          onUpload={handleUploadPlugin}
          onClose={() => setShowPluginMgr(false)}
          installedSearch={installedSearch}
          setInstalledSearch={setInstalledSearch}
          browseSearch={browseSearch}
          setBrowseSearch={setBrowseSearch}
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