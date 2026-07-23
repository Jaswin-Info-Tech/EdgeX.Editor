import { EditorShell } from "./pages/EditorShell";
import { useEditorController } from "./hooks/useEditorController";
import { useMqttResultListener } from "./hooks/useMqttResultListener";
import { Toaster } from "sonner";

export default function App() {
  const editor = useEditorController();
  useMqttResultListener();

  return (
    <>
      <EditorShell {...editor} />
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{ className: "edgex-toast" }}
      />
    </>
  );
}
