import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";

const SAMPLES = {
  "package.json": `{\n  "name": "my-mobile-app",\n  "private": true,\n  "dependencies": {\n    "expo": "^54.0.0",\n    "expo-asset": "^12.0.0"\n  }\n}`,
  "app.json": `{\n  "expo": {\n    "name": "my-mobile-app",\n    "slug": "my-mobile-app"\n  }\n}`,
  "src/App.tsx": `export default function App() {\n  return <Text>Ready on Farm</Text>;\n}\n`,
  "README.md": "# Project\n\nScaffolded from Create from Template.\n",
};

export default function EditorView({ file, onBack }) {
  const { notice, project } = useAppState();
  const [text, setText] = useState(SAMPLES[file] || `// ${file}\n`);

  return (
    <Page>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[15px]">{file}</div>
          <div className="text-[11px] text-[var(--faint)]">{project.label} · project text editor</div>
        </div>
        <div className="flex gap-2">
          <Ghost
            onClick={() => {
              notice("Saved.");
            }}
          >
            Save
          </Ghost>
          <Ghost onClick={onBack}>Back</Ghost>
        </div>
      </div>
      <Card className="p-4">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={16}
          className="w-full resize-y bg-transparent font-mono text-[13px] leading-6 outline-none"
        />
      </Card>
    </Page>
  );
}
