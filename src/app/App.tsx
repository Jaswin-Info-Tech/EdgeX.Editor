import { EditorShell } from "./pages/EditorShell";
import { useEditorController } from "./hooks/useEditorController";
import { Toaster } from "sonner";

export default function App() {
  const editor = useEditorController();

  return (
    <>
      <EditorShell {...editor} />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
