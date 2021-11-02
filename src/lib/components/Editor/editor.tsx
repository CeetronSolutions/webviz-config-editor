import React from "react";
import MonacoEditor, { monaco, EditorDidMount, EditorWillMount } from "react-monaco-editor";
import useSize from "@react-hook/size";

import { setDiagnosticsOptions } from "monaco-yaml";

import { useStore, StoreActions } from "../Store/store";

import { editor, Environment, languages, Position, Range, Uri } from "monaco-editor/esm/vs/editor/editor.api";

import "./editor.css";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";

declare global {
    interface Window {
        MonacoEnvironment: Environment;
    }
}

window.MonacoEnvironment = {
    getWorker(moduleId, label) {
        switch (label) {
            case "editorWorkerService":
                return new EditorWorker();
            case "yaml":
                return new YamlWorker();
            default:
                throw new Error(`Unknown label ${label}`);
        }
    },
};

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

//loader.config({ paths: { vs: uriFromPath(path.join(appPath, "node_modules/monaco-editor/min/vs")) } });

type EditorProps = {};

export const Editor: React.FC<EditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState(1);
    const [currentLine, setCurrentLine] = React.useState(0);
    const [currentColumn, setCurrentColumn] = React.useState(0);
    const [currentSelection, setCurrentSelection] = React.useState<number | undefined>(undefined);

    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);

    const store = useStore();
    const [totalWidth, totalHeight] = useSize(editorRef);

    const fontSizes = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];

    const handleChange = (value: string) => {
        store.dispatch({ type: StoreActions.SetEditorValue, payload: { value: value } });
    };

    const handleEditorDidMount: EditorDidMount = (editor) => {
        monacoRef.current = editor;
    };

    React.useEffect(() => {
        if (!monacoRef || !monacoRef.current) {
            return;
        }
        monacoRef.current.updateOptions({ fontSize: 12 * fontSize });
    }, [fontSize, monacoRef]);

    const handleEditorWillMount: EditorWillMount = (monaco) => {
        setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: true,
            hover: true,
            format: true,
            completion: true,
            schemas: [
                {
                    fileMatch: ["*"],
                    uri: "file:///home/ruben/.local/share/webviz/webviz_schema.json",
                },
            ],
        });
    };

    return (
        <div className="Editor" ref={editorRef}>
            <MonacoEditor
                language="yaml"
                defaultValue=""
                className="YamlEditor"
                editorDidMount={handleEditorDidMount}
                editorWillMount={handleEditorWillMount}
                theme="vs"
                onChange={(value: string) => handleChange(value)}
                options={{ tabSize: 2, insertSpaces: true, quickSuggestions: { other: true, strings: true } }}
                width={totalWidth}
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
