"use client";

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import type { EditorView } from "@codemirror/view";

export interface CodeEditorRef {
    insert: (text: string) => void;
}

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;
}

type EditorComponent = React.ComponentType<{
    value: string;
    height: string;
    onChange: (val: string) => void;
    onCreateEditor: (view: EditorView) => void;
    extensions: unknown[];
    theme: string;
    className: string;
}>;

const VAR_CHIP_CSS = `.cm-variable-chip { background: rgba(91,108,240,0.10); color: #8B9BFF; border-radius: 3px; padding: 0 1px; }`;

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(function CodeEditor(
    { value, onChange, height = "320px" },
    ref
) {
    const [Editor, setEditor] = useState<EditorComponent | null>(null);
    const [extensions, setExtensions] = useState<unknown[]>([]);
    const viewRef = useRef<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
        insert(text: string) {
            const view = viewRef.current;
            if (!view) { onChange(value + text); return; }
            const pos = view.state.selection.main.head;
            view.dispatch({
                changes: { from: pos, insert: text },
                selection: { anchor: pos + text.length },
            });
            view.focus();
        },
    }));

    useEffect(() => {
        Promise.all([
            import("@uiw/react-codemirror"),
            import("@codemirror/lang-html"),
            import("@codemirror/view"),
            import("@codemirror/state"),
        ]).then(([cm, { html }, { Decoration, EditorView: EV, keymap }, { StateField, RangeSetBuilder, Prec }]) => {
            const VAR_RE = /\{\{[^}]*\}\}/g;
            const chipMark = Decoration.mark({ class: "cm-variable-chip" });

            function buildDecos(text: string) {
                const builder = new RangeSetBuilder<typeof chipMark>();
                VAR_RE.lastIndex = 0;
                let m: RegExpExecArray | null;
                while ((m = VAR_RE.exec(text)) !== null) {
                    builder.add(m.index, m.index + m[0].length, chipMark);
                }
                return builder.finish();
            }

            // Highlight {{...}} tokens in the editor
            const variableHighlight = StateField.define({
                create(state) { return buildDecos(state.doc.toString()); },
                update(decos: ReturnType<typeof buildDecos>, tr: { docChanged: boolean; newDoc: { toString(): string }; changes: unknown }) {
                    return tr.docChanged ? buildDecos(tr.newDoc.toString()) : (decos as { map(c: unknown): typeof decos }).map(tr.changes);
                },
                provide: (f: unknown) => EV.decorations.from(f as Parameters<typeof EV.decorations.from>[0]),
            });

            // Atomic deletion: Backspace/Delete removes the whole {{token}} at once
            function deleteAtVar(view: EditorView, dir: "backward" | "forward") {
                const { main } = view.state.selection;
                if (!main.empty) return false;
                const pos = main.head;
                const text = view.state.doc.toString();
                VAR_RE.lastIndex = 0;
                let m: RegExpExecArray | null;
                while ((m = VAR_RE.exec(text)) !== null) {
                    const start = m.index, end = m.index + m[0].length;
                    const hit = dir === "backward" ? pos > start && pos <= end : pos >= start && pos < end;
                    if (hit) {
                        view.dispatch({ changes: { from: start, to: end } });
                        return true;
                    }
                }
                return false;
            }

            // Prec.highest so our handler runs before the default Backspace/Delete
            const variableKeymap = Prec.highest(keymap.of([
                { key: "Backspace", run: (v: EditorView) => deleteAtVar(v, "backward") },
                { key: "Delete",    run: (v: EditorView) => deleteAtVar(v, "forward") },
            ]));

            setEditor(() => cm.default as EditorComponent);
            setExtensions([html(), variableHighlight, variableKeymap]);
        });
    }, []);

    if (!Editor) {
        return (
            <div
                className="border border-[#8B99B0]/20 rounded-lg bg-[#0D1424] p-4 text-[#8B99B0] text-sm flex items-center justify-center"
                style={{ height }}
            >
                Loading editor...
            </div>
        );
    }

    return (
        <>
            <style>{VAR_CHIP_CSS}</style>
            <Editor
                value={value}
                height={height}
                onChange={onChange}
                onCreateEditor={(view) => { viewRef.current = view; }}
                extensions={extensions}
                theme="dark"
                className="border border-[#8B99B0]/20 rounded-lg overflow-hidden text-sm"
            />
        </>
    );
});

export default CodeEditor;
