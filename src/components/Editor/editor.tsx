import {useYamlSchema} from "@hooks/useYamlSchema";
import {
    AssistantPhoto,
    Error as ErrorIcon,
    FolderOpen,
    Info,
    InsertDriveFile,
    Warning,
} from "@mui/icons-material";
import {Badge, Button, Grid, Paper, Tooltip, useTheme} from "@mui/material";
import useSize from "@react-hook/size";
import {useYamlParser} from "@services/yaml-parser";

import {ipcRenderer} from "electron";

import React from "react";
import MonacoEditor, {EditorDidMount, monaco} from "react-monaco-editor";

import {FileTabs} from "@components/FileTabs";
import {ResizablePanels} from "@components/ResizablePanels";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {
    addNewFile,
    setActiveFile,
    setEditorViewState,
    setValue,
} from "@redux/reducers/files";
import {openFile} from "@redux/thunks";

import {CodeEditorViewState} from "@shared-types/files";

// @ts-ignore
import {Environment, Uri, languages} from "monaco-editor";
// @ts-ignore
import "monaco-yaml/lib/esm/monaco.contribution";
// @ts-ignore
import * as path from "path";
import {uuid} from "uuidv4";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import EditorWorker from "worker-loader!monaco-editor/esm/vs/editor/editor.worker";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlWorker from "worker-loader!monaco-yaml/lib/esm/yaml.worker";

import "./editor.css";

declare global {
    interface Window {
        MonacoEnvironment: Environment;
    }
}

window.MonacoEnvironment = {
    getWorker(moduleId, label) {
        console.log(`Current language: ${label}`);
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

const convertFromViewState = (
    viewState: monaco.editor.ICodeEditorViewState | null
): CodeEditorViewState | null => {
    if (!viewState) {
        return null;
    }
    return {
        ...viewState,
        viewState: {
            ...viewState.viewState,
            firstPosition: {
                column: viewState.viewState.firstPosition.column,
                lineNumber: viewState.viewState.firstPosition.lineNumber,
            },
        },
    };
};

// @ts-ignore
const {yaml} = languages || {};

type EditorProps = {};

export const Editor: React.FC<EditorProps> = props => {
    const [code, setCode] = React.useState<string>("");
    const [fontSize, setFontSize] = React.useState<number>(1);
    const [noModels, setNoModels] = React.useState<boolean>(false);
    const [selection, setSelection] = React.useState<monaco.ISelection | null>(
        null
    );
    const [lineDecorations, setLineDecorations] = React.useState<string[]>([]);
    const [markers, setMarkers] = React.useState<monaco.editor.IMarker[]>([]);
    const parserTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const yamlParser = useYamlParser();

    const monacoEditorRef =
        React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const monacoRef = React.useRef<typeof monaco | null>(null);

    const [totalWidth, totalHeight] = useSize(editorRef);

    const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const theme = useTheme();
    const dispatch = useAppDispatch();

    const selectedYamlObject = useAppSelector(
        state =>
            state.files.files.find(el => el.filePath === state.files.activeFile)
                ?.selectedYamlObject
    );
    const files = useAppSelector(state => state.files.files);
    const activeFile = useAppSelector(state => state.files.activeFile);
    const recentDocuments =
        useAppSelector(state => state.ui.recentDocuments) || [];

    useYamlSchema(yaml);

    const fontSizes = [
        0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
        2,
    ];

    React.useEffect(() => {
        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
            }
        };
    });

    const handleCursorPositionChange = (
        e: monaco.editor.ICursorPositionChangedEvent
    ): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !== e.position.lineNumber ||
            selection.positionLineNumber !== e.position.lineNumber ||
            selection.selectionStartColumn !== e.position.column ||
            selection.positionColumn !== e.position.column
        ) {
            setSelection(
                new monaco.Selection(
                    e.position.lineNumber,
                    e.position.column,
                    e.position.lineNumber,
                    e.position.column
                )
            );
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            yamlParser.updateSelection(
                new monaco.Selection(
                    e.position.lineNumber,
                    e.position.column,
                    e.position.lineNumber,
                    e.position.column
                )
            );
            if (monacoEditorRef.current) {
                dispatch(
                    setEditorViewState(
                        convertFromViewState(
                            monacoEditorRef.current.saveViewState()
                        )
                    )
                );
            }
        }
    };

    const handleCursorSelectionChange = (
        e: monaco.editor.ICursorSelectionChangedEvent
    ): void => {
        if (
            selection === null ||
            selection.selectionStartLineNumber !==
                e.selection.selectionStartLineNumber ||
            selection.positionLineNumber !== e.selection.positionLineNumber ||
            selection.selectionStartColumn !==
                e.selection.selectionStartColumn ||
            selection.positionColumn !== e.selection.positionColumn
        ) {
            setSelection(e.selection);
            if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
                return;
            }
            yamlParser.updateSelection(e.selection);
            if (monacoEditorRef.current) {
                dispatch(
                    setEditorViewState(
                        convertFromViewState(
                            monacoEditorRef.current.saveViewState()
                        )
                    )
                );
            }
        }
    };

    const updateLineDecorations = React.useCallback(
        (newDecorations: monaco.editor.IModelDeltaDecoration[]) => {
            if (!monacoEditorRef.current) {
                return;
            }
            setLineDecorations(
                monacoEditorRef.current.deltaDecorations(
                    lineDecorations,
                    newDecorations
                )
            );
        },
        [lineDecorations]
    );

    React.useEffect(() => {
        if (monacoEditorRef.current && selection && selectedYamlObject) {
            updateLineDecorations([
                {
                    range: new monaco.Range(
                        selectedYamlObject.startLineNumber,
                        0,
                        selectedYamlObject.endLineNumber,
                        0
                    ),
                    options: {
                        isWholeLine: true,
                        linesDecorationsClassName:
                            "Editor__CurrentObjectDecoration",
                    },
                },
            ]);
            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                selectedYamlObject.startLineNumber,
                selectedYamlObject.endLineNumber
            );
        }
    }, [selectedYamlObject]);

    const handleFileChange = (filePath: string) => {
        if (monacoEditorRef.current) {
            dispatch(
                setActiveFile({
                    filePath,
                    viewState: convertFromViewState(
                        monacoEditorRef.current.saveViewState()
                    ),
                })
            );
        }
        setTimeout(handleMarkersChange, 2000);
    };

    const handleEditorValueChange = (
        e: monaco.editor.IModelContentChangedEvent
    ) => {
        if (e.isFlush) {
            return;
        }
        const model = monacoEditorRef.current?.getModel();
        if (model) {
            if (parserTimer.current) {
                clearTimeout(parserTimer.current);
            }
            parserTimer.current = setTimeout(() => {
                dispatch(setValue(model.getValue()));
                yamlParser.parse(model.getValue());
            }, 200);
        }
    };

    const handleMarkersChange = () => {
        if (!monacoRef.current || !monacoEditorRef.current) {
            return;
        }
        setMarkers(
            monacoRef.current.editor.getModelMarkers({
                resource: monacoEditorRef.current.getModel()?.uri,
            })
        );
    };

    const handleEditorViewStateChanged = () => {
        if (monacoEditorRef.current) {
            dispatch(
                setEditorViewState(
                    convertFromViewState(
                        monacoEditorRef.current.saveViewState()
                    )
                )
            );
        }
    };

    const handleEditorDidMount: EditorDidMount = (editor, monacoInstance) => {
        monacoEditorRef.current = editor;
        monacoRef.current = monacoInstance;
        monacoEditorRef.current.onDidChangeModelContent(
            handleEditorValueChange
        );
        monacoEditorRef.current.onDidChangeCursorPosition(
            handleCursorPositionChange
        );
        monacoEditorRef.current.onDidChangeCursorSelection(
            handleCursorSelectionChange
        );
        monacoRef.current.editor.onDidChangeMarkers(handleMarkersChange);
        monacoEditorRef.current.onDidLayoutChange(handleEditorViewStateChanged);
        monacoEditorRef.current.onDidScrollChange(handleEditorViewStateChanged);
    };

    React.useEffect(() => {
        if (!monacoEditorRef || !monacoEditorRef.current) {
            return;
        }
        monacoEditorRef.current.updateOptions({fontSize: 12 * fontSize});
    }, [fontSize, monacoEditorRef]);

    React.useEffect(() => {
        const file = files.find(el => el.filePath === activeFile);
        if (files.length === 0) {
            setNoModels(true);
            return;
        }
        if (file && monacoEditorRef.current && monacoRef.current) {
            const currentModel = monacoEditorRef.current.getModel();
            if (currentModel?.uri.path !== file.filePath) {
                if (currentModel) {
                    currentModel.dispose();
                }
                monacoEditorRef.current.setModel(
                    monacoRef.current.editor.createModel(
                        file.editorValue,
                        undefined,
                        Uri.parse(file.filePath)
                    )
                );
                if (file.editorViewState) {
                    monacoEditorRef.current.restoreViewState(
                        file.editorViewState
                    );
                }
                monacoEditorRef.current.focus();
                setNoModels(false);
            }
        }
    }, [activeFile, files]);

    const handleNewFileClick = () => {
        dispatch(addNewFile());
    };

    const selectMarker = (marker: monaco.editor.IMarker) => {
        if (monacoEditorRef.current) {
            monacoEditorRef.current.setSelection(
                new monaco.Range(
                    marker.startLineNumber,
                    marker.startColumn,
                    marker.endLineNumber,
                    marker.endColumn
                )
            );
            monacoEditorRef.current.revealLinesInCenterIfOutsideViewport(
                marker.startLineNumber,
                marker.endLineNumber
            );
        }
    };

    React.useEffect(() => {
        return () => {
            if (monacoEditorRef.current && monacoRef.current) {
                monacoRef.current.editor
                    .getModels()
                    .forEach(model => model.dispose());
                monacoEditorRef.current.dispose();
            }
        };
    }, []);

    const makeIssueKey = (marker: monaco.editor.IMarker): string => {
        return `${marker.resource.toString()}-${marker.startLineNumber}-${
            marker.endLineNumber
        }`;
    };

    return (
        <div
            className="EditorWrapper"
            style={{
                backgroundColor:
                    theme.palette.mode === "dark"
                        ? "#1E1E1E"
                        : theme.palette.background.default,
            }}
        >
            <div
                className="Editor__NoModels"
                style={{
                    display: noModels ? "block" : "none",
                    height: totalHeight,
                }}
            >
                <h2>Webviz Config Editor</h2>
                <h3>Start</h3>
                <Button onClick={() => handleNewFileClick()}>
                    <InsertDriveFile style={{marginRight: 8}} /> New File
                </Button>
                <br />
                <Button onClick={() => ipcRenderer.send("FILE_OPEN")}>
                    <FolderOpen style={{marginRight: 8}} /> Open File
                </Button>
                <br />
                <h3>Recent</h3>
                <ul>
                    {recentDocuments.map(doc => (
                        <li key={`recent-document:${doc}`}>
                            <Tooltip title={doc} placement="right">
                                <Button
                                    onClick={() =>
                                        openFile(doc, dispatch, yamlParser)
                                    }
                                >
                                    {path.basename(doc)}
                                </Button>
                            </Tooltip>
                        </li>
                    ))}
                </ul>
            </div>
            <ResizablePanels direction="vertical" id="Editor-Issues">
                <div className="Editor" ref={editorRef}>
                    <FileTabs onFileChange={handleFileChange} />
                    <MonacoEditor
                        language="yaml"
                        defaultValue=""
                        className="YamlEditor"
                        editorDidMount={handleEditorDidMount}
                        theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
                        options={{
                            tabSize: 2,
                            insertSpaces: true,
                            quickSuggestions: {other: true, strings: true},
                        }}
                        width={totalWidth}
                        height={totalHeight - 56}
                    />
                </div>
                <div
                    className="Issues"
                    style={{
                        color: theme.palette.text.primary,
                    }}
                >
                    <Paper
                        elevation={1}
                        style={{padding: 16}}
                        sx={{borderRadius: 0}}
                    >
                        <Grid
                            container
                            columnSpacing={2}
                            spacing={5}
                            direction="row"
                            alignItems="center"
                        >
                            <Grid item>
                                <Badge
                                    badgeContent={markers.length}
                                    color="warning"
                                >
                                    <ErrorIcon color="action" />
                                </Badge>
                            </Grid>
                            <Grid item>Issues</Grid>
                        </Grid>
                    </Paper>
                    <div className="IssuesContent">
                        {markers.map(marker => (
                            <div
                                className="Issue"
                                onClick={() => selectMarker(marker)}
                                key={uuid()}
                            >
                                {marker.severity ===
                                monaco.MarkerSeverity.Error ? (
                                    <ErrorIcon color="error" fontSize="small" />
                                ) : marker.severity ===
                                  monaco.MarkerSeverity.Warning ? (
                                    <Warning color="warning" fontSize="small" />
                                ) : marker.severity ===
                                  monaco.MarkerSeverity.Info ? (
                                    <Info color="info" fontSize="small" />
                                ) : (
                                    <AssistantPhoto
                                        color="primary"
                                        fontSize="small"
                                    />
                                )}{" "}
                                {marker.message}
                                <span className="IssuePosition">
                                    [{marker.startLineNumber},{" "}
                                    {marker.startColumn}]
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </ResizablePanels>
        </div>
    );
};
