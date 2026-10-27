import { useEffect, useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Field, Ghost, Primary } from "../ui.jsx";

export default function EditorView({ file, onFile, onBack, project }) {
  const { files, writeFile, deleteFile, recordCommit, notice } = useAppState();
  const tree = project ? files[project.id] || {} : {};
  const names = Object.keys(tree).sort();
  const current = names.includes(file) ? file : names[0] || "";
  const [text, setText] = useState(tree[current] || "");
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    setText(tree[current] || "");
  }, [current, project?.id, files]);

  return (
    <Page wide>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[15px]">{current || "No files"}</div>
          <div className="text-[11px] text-[var(--faint)]">{project ? project.label : "No repository"} · project text editor</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Primary
            onClick={() => {
              if (!current || !project) return;
              writeFile(project.id, current, text);
              recordCommit(project.id, "Save " + current);
              notice("Saved " + current + ".");
            }}
          >
            Save
          </Primary>
          <Ghost onClick={onBack}>Back</Ghost>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <Card className="p-2">
          <ul className="space-y-0.5 text-[12.5px]">
            {names.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onFile?.(name)}
                  className={`w-full rounded-lg px-2 py-2 text-left ${name === current ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"}`}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2 px-1 pb-1">
            <Field label="New file" value={draftName} onChange={setDraftName} placeholder="src/New.tsx" />
            <Ghost
              onClick={() => {
                const path = draftName.trim();
                if (!path || !project) return;
                writeFile(project.id, path, "");
                setDraftName("");
                onFile?.(path);
                notice(path + " created.");
              }}
            >
              Add
            </Ghost>
            {current && (
              <Ghost
                onClick={() => {
                  if (!project) return;
                  deleteFile(project.id, current);
                  notice(current + " removed.");
                  onFile?.(names.find((name) => name !== current) || "");
                }}
              >
                Delete file
              </Ghost>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={22}
            spellCheck={false}
            className="w-full resize-y bg-transparent font-mono text-[13px] leading-6 outline-none"
          />
        </Card>
      </div>
    </Page>
  );
}
