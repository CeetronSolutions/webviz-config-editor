import React from "react";
import MonacoEditor, { monaco, EditorDidMount, EditorWillMount } from "react-monaco-editor";
import useSize from "@react-hook/size";
import { Environment } from "monaco-editor/esm/vs/editor/editor.api";
import { setDiagnosticsOptions } from "monaco-yaml";
import { ipcRenderer } from "electron";
import * as path from "path";

import { FilesStore } from "../Store";

import "./editor.css";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";
import { FileTabs } from "../FileTabs";
import {
    AssistantPhoto,
    Cancel,
    Error as ErrorIcon,
    FolderOpen,
    Info,
    InsertDriveFile,
    Warning,
} from "@mui/icons-material";
import { Button, Tooltip } from "@mui/material";
import { preprocessJsonSchema } from "../../utils/json-schema-preprocessor";
import { ResizablePanels } from "../ResizablePanels";

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
    const [markers, setMarkers] = React.useState<monaco.editor.IMarker[]>([]);

    const monacoEditorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const store = FilesStore.useStore();
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
                type: FilesStore.StoreActions.UpdateSelection,
                payload: {
                    selection: new monaco.Selection(
                        e.position.lineNumber,
                        e.position.column,
                        e.position.lineNumber,
                        e.position.column
                    ),
                    source: FilesStore.UpdateSource.Editor,
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
                type: FilesStore.StoreActions.UpdateSelection,
                payload: {
                    selection: e.selection,
                    source: FilesStore.UpdateSource.Editor,
                },
            });
        }
    };

    const updateLineDecorations = React.useCallback(
        (newDecorations: monaco.editor.IModelDeltaDecoration[]) => {
            if (!monacoEditorRef.current) {
                return;
            }
            setLineDecorations(monacoEditorRef.current.deltaDecorations(lineDecorations, newDecorations));
        },
        [lineDecorations]
    );

    React.useEffect(() => {
        if (monacoEditorRef.current && selection && store.state.selectedYamlObject) {
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
            if (store.state.updateSource !== FilesStore.UpdateSource.Editor) {
                monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                    store.state.selectedYamlObject.startLineNumber,
                    store.state.selectedYamlObject.endLineNumber
                );
            }
        }
    }, [store.state.selectedYamlObject, store.state.updateSource]);

    const handleFileChange = (uuid: string) => {
        const file = store.state.files.find((el) => el.uuid === store.state.activeFileUuid);
        if (file && monacoEditorRef.current) {
            store.dispatch({
                type: FilesStore.StoreActions.SetActiveFile,
                payload: { uuid: uuid, viewState: monacoEditorRef.current.saveViewState() },
            });
        }
        handleMarkersChange();
    };

    const handleEditorValueChange = (value: string) => {
        store.dispatch({ type: FilesStore.StoreActions.UpdateCurrentContent, payload: { content: value } });
    };

    const handleMarkersChange = () => {
        if (!monacoRef.current || !monacoEditorRef.current) {
            return;
        }
        setMarkers(
            monacoRef.current.editor
                .getModelMarkers({})
                .filter((el) => el.resource.fsPath === monacoEditorRef.current?.getModel()?.uri.path || "")
        );
    };

    const handleEditorDidMount: EditorDidMount = (editor, monaco) => {
        monacoEditorRef.current = editor;
        monacoRef.current = monaco;
        monacoEditorRef.current.onDidChangeCursorPosition(handleCursorPositionChange);
        monacoEditorRef.current.onDidChangeCursorSelection(handleCursorSelectionChange);
        monacoRef.current.editor.onDidChangeMarkers(handleMarkersChange);
    };

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({ fontSize: 12 * fontSize });
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        const file = store.state.files.find((el) => el.uuid === store.state.activeFileUuid);
        if (!file) {
            setNoModels(true);
            return;
        }
        if (monacoEditorRef.current && file.editorModel !== monacoEditorRef.current.getModel()) {
            monacoEditorRef.current.setModel(file.editorModel);
            if (file.editorViewState) {
                monacoEditorRef.current.restoreViewState(file.editorViewState);
            }
            monacoEditorRef.current.focus();
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
        store.dispatch({ type: FilesStore.StoreActions.AddNewFile, payload: {} });
    };

    const selectMarker = (marker: monaco.editor.IMarker) => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.setSelection(
                new monaco.Range(marker.startLineNumber, marker.startColumn, marker.endLineNumber, marker.endColumn)
            );
            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(marker.startLineNumber, marker.endLineNumber);
        }
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
                                        store.dispatch({
                                            type: FilesStore.StoreActions.OpenFile,
                                            payload: { filePath: doc },
                                        })
                                    }
                                >
                                    {path.basename(doc)}
                                </Button>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            </div>
            <ResizablePanels direction="vertical">
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
                        width={totalWidth - 16}
                        height={totalHeight - 65}
                    />
                </div>
                <div className="Problems">
                    <div className="ProblemsTitle">Problems</div>
                    <div className="ProblemsContent">
                        {markers.map((marker) => (
                            <div className="Problem" onClick={() => selectMarker(marker)}>
                                {marker.severity === monaco.MarkerSeverity.Error ? (
                                    <ErrorIcon color="error" fontSize="small" />
                                ) : marker.severity === monaco.MarkerSeverity.Warning ? (
                                    <Warning color="warning" fontSize="small" />
                                ) : marker.severity === monaco.MarkerSeverity.Info ? (
                                    <Info color="info" fontSize="small" />
                                ) : (
                                    <AssistantPhoto color="primary" fontSize="small" />
                                )}{" "}
                                {marker.message}
                                <span className="ProblemPosition">
                                    [{marker.startLineNumber}, {marker.startColumn}]
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </ResizablePanels>
        </div>
    );
};
