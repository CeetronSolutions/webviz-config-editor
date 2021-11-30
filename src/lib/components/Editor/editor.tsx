import React from "react";
import MonacoEditor, { monaco, EditorDidMount, EditorWillMount } from "react-monaco-editor";
import useSize from "@react-hook/size";
import { Environment } from "monaco-editor/esm/vs/editor/editor.api";
import { setDiagnosticsOptions } from "monaco-yaml";
import { ipcRenderer } from "electron";
import * as path from "path";

import { useStore, StoreActions, UpdateSource } from "../Store/store";

import "./editor.css";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";
import { FileTabs } from "../FileTabs";
import { FolderOpen, InsertDriveFile } from "@mui/icons-material";
import { Button, Tooltip } from "@mui/material";
import { preprocessJsonSchema } from "../../utils/json-schema-preprocessor";

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

type EditorProps = {};

export const Editor: React.FC<EditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState<number>(1);
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [selection, setSelection] = React.useState<monaco.ISelection | null>(null);
    const [lineDecorations, setLineDecorations] = React.useState<string[]>([]);

    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);

    const store = useStore();
    const [totalWidth, totalHeight] = useSize(editorRef);

    const fontSizes = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];

    const handleCursorPositionChange = (e: monaco.editor.ICursorPositionChangedEvent): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.position.lineNumber ||
            selection.positionLineNumber !== e.position.lineNumber ||
            selection.selectionStartColumn !== e.position.column ||
            selection.positionColumn !== e.position.column
        ) {
            setSelection(
                new monaco.Selection(e.position.lineNumber, e.position.column, e.position.lineNumber, e.position.column)
            );
            store.dispatch({
                type: StoreActions.UpdateSelection,
                payload: {
                    selection: new monaco.Selection(
                        e.position.lineNumber,
                        e.position.column,
                        e.position.lineNumber,
                        e.position.column
                    ),
                    source: UpdateSource.Editor,
                },
            });
        }
    };

    const handleCursorSelectionChange = (e: monaco.editor.ICursorSelectionChangedEvent): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.selection.selectionStartLineNumber ||
            selection.positionLineNumber !== e.selection.positionLineNumber ||
            selection.selectionStartColumn !== e.selection.selectionStartColumn ||
            selection.positionColumn !== e.selection.positionColumn
        ) {
            setSelection(e.selection);
            store.dispatch({
                type: StoreActions.UpdateSelection,
                payload: {
                    selection: e.selection,
                    source: UpdateSource.Editor,
                },
            });
        }
    };

    const updateLineDecorations = React.useCallback(
        (newDecorations: monaco.editor.IModelDeltaDecoration[]) => {
            if (!monacoRef.current) {
                return;
            }
            setLineDecorations(monacoRef.current.deltaDecorations(lineDecorations, newDecorations));
        },
        [lineDecorations]
    );

    React.useEffect(() => {
        if (monacoRef.current && selection && store.state.selectedYamlObject) {
            updateLineDecorations([
                {
                    range: new monaco.Range(
                        store.state.selectedYamlObject.startLineNumber,
                        0,
                        store.state.selectedYamlObject.endLineNumber,
                        0
                    ),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName: "Editor__CurrentObjectDecoration",
                    },
                },
            ]);
            if (store.state.updateSource !== UpdateSource.Editor) {
                monacoRef.current.revealLinesInCenterIfOutsideViewport(
                    store.state.selectedYamlObject.startLineNumber,
                    store.state.selectedYamlObject.endLineNumber
                );
            }
        }
    }, [store.state.selectedYamlObject, store.state.updateSource]);

    const handleFileChange = (uuid: string) => {
        const file = store.state.files.find((el) => el.uuid === store.state.activeFileUuid);
        if (file && monacoRef.current) {
            store.dispatch({
                type: StoreActions.SetActiveFile,
                payload: { uuid: uuid, viewState: monacoRef.current.saveViewState() },
            });
        }
    };

    const handleEditorValueChange = (value: string) => {
        store.dispatch({ type: StoreActions.UpdateCurrentContent, payload: { content: value } });
    };

    const handleEditorDidMount: EditorDidMount = (editor) => {
        monacoRef.current = editor;
        monacoRef.current.onDidChangeCursorPosition(handleCursorPositionChange);
        monacoRef.current.onDidChangeCursorSelection(handleCursorSelectionChange);
    };

    React.useEffect(() => {
        if (!monacoRef || !monacoRef.current) {
            return;
        }
        monacoRef.current.updateOptions({ fontSize: 12 * fontSize });
    }, [fontSize, monacoRef]);

    React.useEffect(() => {
        const file = store.state.files.find((el) => el.uuid === store.state.activeFileUuid);
        if (!file) {
            setNoModels(true);
            return;
        }
        if (monacoRef.current && file.editorModel !== monacoRef.current.getModel()) {
            monacoRef.current.setModel(file.editorModel);
            if (file.editorViewState) {
                monacoRef.current.restoreViewState(file.editorViewState);
            }
            monacoRef.current.focus();
            setNoModels(false);
        }
    }, [store.state.activeFileUuid, store.state.files]);

    const handleEditorWillMount: EditorWillMount = (monaco) => {
        let jsonSchema = undefined;
        try {
            jsonSchema = preprocessJsonSchema("/home/ruben/.local/share/webviz/webviz_schema.json");
        } catch (e) {
            console.log("Error");
        }

        setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: true,
            hover: true,
            format: true,
            completion: true,
            schemas: [
                {
                    fileMatch: ["*"],
                    schema: jsonSchema,
                    uri: "file:///home/ruben/.local/share/webviz/webviz_schema.json",
                },
            ],
        });
    };

    const handleNewFileClick = () => {
        store.dispatch({ type: StoreActions.AddNewFile, payload: {} });
    };

    return (
        <div className="EditorWrapper">
            <div className="Editor__NoModels" style={{ display: noModels ? "block" : "none", height: totalHeight }}>
                <h2>Webviz Config Editor</h2>
                <h3>Start</h3>
                <Button onClick={() => handleNewFileClick()}>
                    <InsertDriveFile style={{ marginRight: 8 }} /> New File
                </Button>
                <br />
                <Button onClick={() => ipcRenderer.send("FILE_OPEN")}>
                    <FolderOpen style={{ marginRight: 8 }} /> Open File
                </Button>
                <br />
                <h3>Recent</h3>
                <ul>
                    {store.state.recentDocuments.map((doc) => (
                        <li key={`recent-document:${doc}`}>
                            <Tooltip title={doc} placement="right">
                                <Button
                                    onClick={() =>
                                        store.dispatch({ type: StoreActions.OpenFile, payload: { filePath: doc } })
                                    }
                                >
                                    {path.basename(doc)}
                                </Button>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="Editor" ref={editorRef}>
                <FileTabs onFileChange={handleFileChange} />
                <MonacoEditor
                    language="yaml"
                    defaultValue=""
                    className="YamlEditor"
                    editorDidMount={handleEditorDidMount}
                    editorWillMount={handleEditorWillMount}
                    onChange={handleEditorValueChange}
                    theme="vs-dark"
                    options={{ tabSize: 2, insertSpaces: true, quickSuggestions: { other: true, strings: true } }}
                    width={totalWidth}
                />
                <div className="EditorSettings">
                    <select value={fontSize} onChange={(event) => setFontSize(parseFloat(event.target.value))}>
                        {fontSizes.map((size) => (
                            <option value={size} key={size}>{`${Math.floor(size * 100)} %`}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
