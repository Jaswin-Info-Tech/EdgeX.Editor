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
  showPluginMgr: boolean;
  setShowPluginMgr: (value: boolean) => void;
  plugins: any[];
  installedPackages: any[];
  installedPackageSearch: string;
  setInstalledPackageSearch: (value: string) => void;
  isInstalledPackagesFetching: boolean;
  availablePackageSearch: string;
  setAvailablePackageSearch: (value: string) => void;
  isAvailablePackagesFetching: boolean;
  handleInstallPlugin: (id: string) => Promise<void>;
  handleUninstallPlugin: (id: string) => Promise<void>;
  handleUninstallPackage: (id: string) => Promise<void>;
  handleUploadPlugin: (file: File) => Promise<void>;
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
  installedPackages,
  installedPackageSearch,
  setInstalledPackageSearch,
  isInstalledPackagesFetching,
  availablePackageSearch,
  setAvailablePackageSearch,
  isAvailablePackagesFetching,
  handleInstallPlugin,
  handleUninstallPlugin,
  handleUninstallPackage,
  handleUploadPlugin,
  contextMenu,
  setContextMenu,
  handleContextAction,
}: ModalsHostProps) {
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
          installedPlugins={installedPackages}
          installedSearch={installedPackageSearch}
          setInstalledSearch={setInstalledPackageSearch}
          isInstalledLoading={isInstalledPackagesFetching}
          availableSearch={availablePackageSearch}
          setAvailableSearch={setAvailablePackageSearch}
          isAvailableLoading={isAvailablePackagesFetching}
          onInstall={handleInstallPlugin}
          onUninstall={handleUninstallPlugin}
          onUninstallPackage={handleUninstallPackage}
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
