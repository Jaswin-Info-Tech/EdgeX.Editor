export {};

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      isWindowMaximized: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
    };
  }
}
