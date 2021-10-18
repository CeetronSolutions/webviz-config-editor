import React from "react";
import MonacoEditor, { Monaco, OnMount, loader } from "@monaco-editor/react";

import { setDiagnosticsOptions } from "monaco-yaml";

import { useStore, StoreActions } from "../Store/store";

import "./editor.css";
import fs from "fs";

const defaultSchemaUri = fs.readFileSync("/home/ruben/.local/share/webviz/webviz_schema.json", "utf-8");
console.log(defaultSchemaUri);

const path = require("path");
const app = require("@electron/remote").app;

const appPath = app.getAppPath();

function ensureFirstBackSlash(str: string): string {
    return str.length > 0 && str.charAt(0) !== "/" ? "/" + str : str;
}

function uriFromPath(_path: unknown): string {
    const pathName = path.resolve(_path).replace(/\\/g, "/");
    return encodeURI("file://" + ensureFirstBackSlash(pathName));
}

console.log(uriFromPath(path.join(appPath, "node_modules/monaco-editor/min/vs")));

loader.config({ paths: { vs: uriFromPath(path.join(appPath, "node_modules/monaco-editor/min/vs")) } });

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
            enableSchemaRequest: true,
            hover: true,
            format: true,
            completion: true,
            schemas: [
                {
                    fileMatch: ["monaco-yaml.yaml"],
                    uri: defaultSchemaUri,
                },
            ],
        });
    }, []);

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
                        <option value={size} key={size}>{`${Math.floor(size * 100)} %`}</option>
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
