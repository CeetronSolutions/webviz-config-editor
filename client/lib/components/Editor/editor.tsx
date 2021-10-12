import React from "react";
import MonacoEditor, { Monaco, OnMount } from "@monaco-editor/react";

import { setDiagnosticsOptions } from "monaco-yaml";

import { useStore, StoreActions } from "../Store/store";

import "./editor.css";

type YamlEditorProps = {};

export const YamlEditor: React.FC<YamlEditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState(1);
    const [currentLine, setCurrentLine] = React.useState(0);
    const [currentColumn, setCurrentColumn] = React.useState(0);
    const [currentSelection, setCurrentSelection] = React.useState<number | undefined>(undefined);

    const editorRef = React.useRef<Monaco | null>(null);

    const store = useStore();

    const fontSizes = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];

    const handleChange = (value: string) => {
        store.dispatch({ type: StoreActions.SetEditorValue, payload: { value: value } });
    };

    const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
        editorRef.current = monacoInstance;
    };

    React.useEffect(() => {
        setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: false,
            hover: true,
            completion: true,
            schemas: [],
        });
    }, [store.state.jsonSchema]);

    return (
        <div className="Editor">
            <MonacoEditor
                defaultLanguage="yaml"
                defaultValue="// Get started"
                className="YamlEditor"
                onMount={handleEditorDidMount}
                theme="vs"
                onChange={() => {}}
                options={{ tabSize: 2, insertSpaces: true }}
            />
            <div className="EditorSettings">
                <select value={fontSize} onChange={(event) => setFontSize(parseFloat(event.target.value))}>
                    {fontSizes.map((size) => (
                        <option value={size}>{`${Math.floor(size * 100)} %`}</option>
                    ))}
                </select>
                <div className="EditorInfo">
                    {`Ln ${currentLine + 1}, Col ${currentColumn + 1} ${
                        currentSelection ? `(${currentSelection} selected)` : ""
                    }`}
                </div>
            </div>
        </div>
    );
};
