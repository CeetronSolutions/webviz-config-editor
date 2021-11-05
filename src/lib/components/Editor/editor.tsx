import React from "react";
import MonacoEditor, { monaco, EditorDidMount, EditorWillMount } from "react-monaco-editor";
import useSize from "@react-hook/size";
import { Environment } from "monaco-editor/esm/vs/editor/editor.api";
import { setDiagnosticsOptions } from "monaco-yaml";
import { ipcRenderer } from "electron";

import { useStore, StoreActions } from "../Store/store";

import "./editor.css";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";
import { FileTabs } from "../FileTabs";
import { FolderOpen, InsertDriveFile } from "@mui/icons-material";
import { Button } from "@mui/material";

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

    const monacoRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);

    const store = useStore();
    const [totalWidth, totalHeight] = useSize(editorRef);

    const fontSizes = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];

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

    const handleNewFileClick = () => {
        store.dispatch({ type: StoreActions.AddNewFile, payload: {} });
    };

    return (
        <div className="Editor" ref={editorRef}>
            {noModels ? (
                <div className="Editor__NoModels">
                    <h2>Webviz Config Editor</h2>
                    <h3>Start</h3>
                    <Button onClick={() => handleNewFileClick()}>
                        <InsertDriveFile /> New File
                    </Button>
                    <br />
                    <Button onClick={() => ipcRenderer.send("FILE_OPEN")}>
                        <FolderOpen /> Open File
                    </Button>
                    <br />
                    <h3>Recent</h3>
                    ...
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
};
