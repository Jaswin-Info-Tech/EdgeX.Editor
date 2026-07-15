import { EditorShell } from "./pages/EditorShell";
import { useEditorController } from "./hooks/useEditorController";
import { useMqttResultListener } from "./hooks/useMqttResultListener";
import { Toaster } from "sonner";
import { useEffect } from "react";

export default function App() {
  const editor = useEditorController();
  useMqttResultListener();

  useEffect(() => {
    if (!window.electronAPI) return;

    const originalTitle = document.title;
    let isMounted = true;

    window.electronAPI
      .getAppVersion()
      .then((version) => {
        if (isMounted) {
          document.title = `${originalTitle} — v${version}`;
        }
      })
      .catch((error) => {
        console.error("Unable to read the Electron application version.", error);
      });

    return () => {
      isMounted = false;
      document.title = originalTitle;
    };
  }, []);

  return (
    <>
      <EditorShell {...editor} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
