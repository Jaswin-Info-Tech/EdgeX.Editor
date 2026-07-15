export {};

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      downloadInstaller: (options: { url: string }) => Promise<
        | { status: "started" }
        | { status: "error"; message: string }
      >;
      showDownloadedInstaller: (filePath: string) => Promise<void>;
      onInstallerDownloadProgress: (callback: (progress: {
        state: string;
        receivedBytes: number;
        totalBytes: number;
        filePath?: string;
      }) => void) => () => void;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      isWindowMaximized: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    };
  }
}
