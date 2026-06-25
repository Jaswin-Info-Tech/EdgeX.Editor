import { EditorShell } from "./pages/EditorShell";
import { useEditorController } from "./hooks/useEditorController";

export default function App() {
  const editor = useEditorController();

  return <EditorShell {...editor} />;
}
