import React from "react";
import path from "path";

import { Setting, Settings, compressSettings } from "../../utils/settings";
import { makeRequest, RequestMethod } from "../../utils/api";
import { createGenericContext } from "../../utils/generic-context";
import { NotificationType, useNotifications } from "../Notifications";
import { ipcRenderer } from "electron";
import fs from "fs";
import { editor, Uri, Selection, SelectionDirection } from "monaco-editor";
import { uuid } from "uuidv4";

import { File } from "../../types/file";
import { LogEntry, LogEntryType } from "../../types/log";
import { YamlParser, YamlObject, YamlMetaObject } from "../../utils/yaml-parser";

type ActionMap<
    M extends {
        [index: string]: { [key: string]: string | number | Setting[] | object | editor.ICodeEditorViewState | null };
    }
> = {
    [Key in keyof M]: M[Key] extends undefined
        ? {
              type: Key;
          }
        : {
              type: Key;
              payload: M[Key];
          };
};

export enum StoreActions {
    // Settings
    SetSettings = "SET_SETTINGS",
    SetSetting = "SET_SETTING",

    // Files
    SetActiveFile = "SET_ACTIVE_FILE",
    AddNewFile = "ADD_NEW_FILE",
    OpenFile = "OPEN_FILE",
    CloseFile = "CLOSE_FILE",
    DeleteFile = "DELETE_FILE",
    UpdateFileContent = "UPDATE_FILE_CONTENT",
    UpdateCurrentContent = "UPDATE_CURRENT_CONTENT",
    UpdateSelection = "UPDATE_SELECTION",
    SaveFile = "SAVE_FILE",
    SaveFileAs = "SAVE_FILE_AS",
    SetCurrentPage = "SET_CURRENT_PAGE",
    SetRecentDocuments = "SET_RECENT_DOCUMENTS",
}

export enum UpdateSource {
    Editor = "EDITOR",
    Preview = "PREVIEW",
}

export type StoreState = {
    activeFileUuid: string;
    files: File[];
    settings: Setting[];
    log: LogEntry[];
    currentEditorContent: string;
    currentYamlObjects: YamlObject[];
    selectedYamlObject: YamlMetaObject | undefined;
    updateSource: UpdateSource;
    yamlParser: YamlParser;
    currentPageId: string;
    recentDocuments: string[];
};

type Payload = {
    // Settings
    [StoreActions.SetSettings]: {
        settings: Setting[];
    };
    [StoreActions.SetSetting]: {
        id: string;
        value: string | number;
    };

    // Files
    [StoreActions.SetActiveFile]: {
        uuid: string;
        viewState: editor.ICodeEditorViewState | null;
    };
    [StoreActions.AddNewFile]: {};
    [StoreActions.OpenFile]: {
        filePath: string;
    };
    [StoreActions.CloseFile]: {
        uuid: string;
    };
    [StoreActions.DeleteFile]: {
        uuid: string;
    };
    [StoreActions.SaveFile]: {};
    [StoreActions.SaveFileAs]: {
        filePath: string;
    };
    [StoreActions.UpdateCurrentContent]: {
        content: string;
    };
    [StoreActions.UpdateSelection]: {
        selection: Selection;
        source: UpdateSource;
    };
    [StoreActions.SetCurrentPage]: {
        pageId: string;
    };
    [StoreActions.SetRecentDocuments]: {
        recentDocuments: string[];
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialUuid = uuid();

const initialState: StoreState = {
    activeFileUuid: initialUuid,
    files: [
        {
            uuid: initialUuid,
            editorModel: editor.createModel("", "yaml", Uri.parse(path.join(__dirname, "Untitled-1.yaml"))),
            editorViewState: null,
            unsavedChanges: true,
            selection: Selection.createWithDirection(0, 0, 0, 0, SelectionDirection.LTR),
        },
    ],
    settings: compressSettings(Settings),
    log: [],
    currentEditorContent: "",
    currentYamlObjects: [],
    selectedYamlObject: undefined,
    updateSource: UpdateSource.Editor,
    yamlParser: new YamlParser(),
    currentPageId: "",
    recentDocuments: [],
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    return initialState;
};

export const StoreReducer = (state: StoreState, action: Actions): StoreState => {
    switch (action.type) {
        // Settings
        case StoreActions.SetSettings:
            return {
                ...state,
                settings: action.payload.settings,
            };
        case StoreActions.SetSetting:
            const newSettings = state.settings.map((setting) => ({
                id: setting.id,
                value: setting.id === action.payload.id ? action.payload.value : setting.value,
            }));
            return {
                ...state,
                settings: newSettings,
            };

        // Files
        case StoreActions.SetActiveFile:
            const currentlyActiveFile = state.files.find((file) => file.uuid === state.activeFileUuid);
            if (currentlyActiveFile) {
                currentlyActiveFile.editorViewState = action.payload.viewState;
            }
            const newEditorContent =
                state.files.find((file) => file.uuid === action.payload.uuid)?.editorModel.getValue() || "";
            state.yamlParser.parse(newEditorContent);
            return {
                ...state,
                currentEditorContent: newEditorContent,
                currentYamlObjects: state.yamlParser.getObjects(),
                selectedYamlObject: undefined,
                activeFileUuid: action.payload.uuid,
            };
        case StoreActions.OpenFile:
            //try {
            const existingFile = state.files.find((el) => el.editorModel.uri.path === action.payload.filePath);
            if (existingFile) {
                return {
                    ...state,
                    activeFileUuid: existingFile.uuid,
                };
            }
            const newFiles = [...state.files];
            if (
                state.files.length === 1 &&
                state.files[0].editorModel.uri.path === Uri.parse(path.join(__dirname, "Untitled-1.yaml")).path &&
                state.files[0].unsavedChanges
            ) {
                state.files[0].editorModel.dispose();
                newFiles.shift();
            }
            const fileContent = fs.readFileSync(action.payload.filePath).toString();
            const fileUuid = uuid();
            state.yamlParser.parse(fileContent);
            return {
                ...state,
                activeFileUuid: fileUuid,
                currentEditorContent: fileContent,
                currentYamlObjects: state.yamlParser.getObjects(),
                selectedYamlObject: undefined,
                files: [
                    ...newFiles,
                    {
                        uuid: fileUuid,
                        unsavedChanges: false,
                        editorModel: editor.createModel(fileContent, "yaml", Uri.parse(action.payload.filePath)),
                        editorViewState: null,
                        selection: Selection.createWithDirection(0, 0, 0, 0, SelectionDirection.LTR),
                    },
                ],
            };
        /*
            } catch (e) {
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
            */
        case StoreActions.AddNewFile:
            const newUuid = uuid();
            return {
                ...state,
                files: [
                    ...state.files,
                    {
                        uuid: newUuid,
                        unsavedChanges: true,
                        editorModel: editor.createModel(
                            "",
                            "yaml",
                            Uri.parse(
                                path.join(
                                    __dirname,
                                    `Untitled-${
                                        state.files.filter((file) => file.editorModel.uri.path.includes("Untitled-"))
                                            .length + 1
                                    }.yaml`
                                )
                            )
                        ),
                        editorViewState: null,
                        selection: Selection.createWithDirection(0, 0, 0, 0, SelectionDirection.LTR),
                    },
                ],
                activeFileUuid: newUuid,
                currentEditorContent: "",
                currentYamlObjects: [],
                selectedYamlObject: undefined,
            };
        case StoreActions.CloseFile:
            const fileToClose = state.files.find((file) => file.uuid === action.payload.uuid);
            if (fileToClose) {
                window.setTimeout(() => fileToClose.editorModel.dispose(), 100);
                let newActiveFileUUid = state.activeFileUuid;
                if (action.payload.uuid === state.activeFileUuid) {
                    if (state.files.length >= 2) {
                        newActiveFileUUid = state.files.filter((el) => el.uuid !== action.payload.uuid)[
                            Math.max(
                                0,
                                (state.files
                                    .filter((el) => el.uuid !== action.payload.uuid)
                                    .findIndex((file) => file.uuid === action.payload.uuid) || 0) - 1
                            )
                        ].uuid;
                    } else {
                        newActiveFileUUid = "";
                    }
                }
                const newCurrentEditorContent =
                    state.files.find((file) => file.uuid === newActiveFileUUid)?.editorModel.getValue() || "";
                return {
                    ...state,
                    files: state.files.filter((file) => file.uuid !== action.payload.uuid),
                    activeFileUuid: newActiveFileUUid,
                    currentEditorContent: newCurrentEditorContent,
                    currentYamlObjects: state.yamlParser.getObjects(),
                    selectedYamlObject: undefined,
                };
            }
            return state;
        case StoreActions.DeleteFile:
            try {
                const file = state.files.find((file) => file.uuid === action.payload.uuid);
                if (file) {
                    const filePath = file.editorModel.uri.path;
                    if (fs.existsSync(filePath)) {
                        window.setTimeout(() => {
                            file.editorModel.dispose();
                            fs.unlinkSync(filePath);
                        }, 100);
                        let newActiveFileUUid = state.activeFileUuid;
                        if (action.payload.uuid === state.activeFileUuid) {
                            if (state.files.length >= 2) {
                                newActiveFileUUid = state.files.filter((el) => el.uuid !== action.payload.uuid)[
                                    Math.max(
                                        0,
                                        (state.files
                                            .filter((el) => el.uuid !== action.payload.uuid)
                                            .findIndex((file) => file.uuid === action.payload.uuid) || 0) - 1
                                    )
                                ].uuid;
                            } else {
                                newActiveFileUUid = "";
                            }
                        }
                        const newCurrentEditorContent =
                            state.files.find((file) => file.uuid === newActiveFileUUid)?.editorModel.getValue() || "";
                        state.yamlParser.parse(newCurrentEditorContent);
                        return {
                            ...state,
                            files: state.files.filter((file) => file.uuid !== action.payload.uuid),
                            activeFileUuid: newActiveFileUUid,
                            currentEditorContent: newCurrentEditorContent,
                            currentYamlObjects: state.yamlParser.getObjects(),
                            selectedYamlObject: undefined,
                        };
                    }
                }
                return state;
            } catch (e) {
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
        case StoreActions.SaveFile:
            try {
                const file = state.files.find((file) => file.uuid === state.activeFileUuid);
                if (file) {
                    const filePath = file.editorModel.uri.path;
                    fs.writeFileSync(filePath, file.editorModel.getValue(), { encoding: "utf-8", flag: "w" });
                    return {
                        ...state,
                        files: state.files.map((file) =>
                            file.uuid === state.activeFileUuid ? { ...file, unsavedChanges: false } : file
                        ),
                    };
                }
                return state;
            } catch (e) {
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
        case StoreActions.SaveFileAs:
            try {
                const file = state.files.find((file) => file.uuid === state.activeFileUuid);
                if (file) {
                    const filePath = action.payload.filePath;
                    fs.writeFileSync(filePath, file.editorModel.getValue(), { encoding: "utf-8", flag: "w" });
                    const newEditorModel = editor.createModel(
                        file.editorModel.getValue(),
                        "yaml",
                        Uri.parse(action.payload.filePath)
                    );
                    file.editorModel.dispose();
                    return {
                        ...state,
                        files: state.files.map((file) =>
                            file.uuid === state.activeFileUuid
                                ? {
                                      ...file,
                                      unsavedChanges: false,
                                      editorModel: newEditorModel,
                                  }
                                : file
                        ),
                    };
                }
                return state;
            } catch (e) {
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
        case StoreActions.UpdateCurrentContent:
            state.yamlParser.parse(action.payload.content);
            const unsavedChanges =
                action.payload.content !==
                (state.files.find((el) => el.uuid === state.activeFileUuid)?.editorModel.getValue() || "");
            return {
                ...state,
                currentEditorContent: action.payload.content,
                currentYamlObjects: state.yamlParser.getObjects(),
                files: state.files.map((el) =>
                    el.uuid === state.activeFileUuid ? { ...el, unsavedChanges: unsavedChanges } : el
                ),
            };

        case StoreActions.UpdateSelection:
            const currentFile = state.files.find((file) => file.uuid === state.activeFileUuid);
            if (currentFile) {
                currentFile.selection = action.payload.selection;
                const object = state.yamlParser.findClosestObject(
                    Math.min(
                        action.payload.selection.selectionStartLineNumber,
                        action.payload.selection.positionLineNumber
                    ),
                    Math.max(
                        action.payload.selection.selectionStartLineNumber,
                        action.payload.selection.positionLineNumber
                    )
                );
                const page = state.yamlParser.findClosestPage(
                    Math.min(
                        action.payload.selection.selectionStartLineNumber,
                        action.payload.selection.positionLineNumber
                    ),
                    Math.max(
                        action.payload.selection.selectionStartLineNumber,
                        action.payload.selection.positionLineNumber
                    )
                );
                return {
                    ...state,
                    updateSource: action.payload.source,
                    selectedYamlObject: object,
                    currentPageId: page?.id || "",
                };
            }
            return state;

        case StoreActions.SetCurrentPage:
            return {
                ...state,
                currentPageId: action.payload.pageId,
            };

        case StoreActions.SetRecentDocuments:
            return {
                ...state,
                recentDocuments: action.payload.recentDocuments,
            };
    }
    return state;
};

type Context = {
    state: StoreState;
    dispatch: React.Dispatch<Actions>;
};

const [useStoreContext, StoreContextProvider] = createGenericContext<Context>();

export const StoreProvider: React.FC = (props) => {
    const [state, dispatch] = React.useReducer(StoreReducer, initialState, StoreReducerInit);

    const notifications = useNotifications();

    React.useEffect(() => {
        ipcRenderer.on("FILE_OPEN", (event, args) => {
            dispatch({
                type: StoreActions.OpenFile,
                payload: {
                    filePath: args[0],
                },
            });
        });
        ipcRenderer.on("NEW_FILE", (event, args) => {
            dispatch({
                type: StoreActions.AddNewFile,
                payload: {},
            });
        });
        ipcRenderer.on("SAVE_FILE", (event, args) => {
            dispatch({
                type: StoreActions.SaveFile,
                payload: {},
            });
        });
        ipcRenderer.on("SAVE_FILE_AS", (event, arg: string) => {
            dispatch({
                type: StoreActions.SaveFileAs,
                payload: {
                    filePath: arg,
                },
            });
        });
        ipcRenderer.on("UPDATE_RECENT_DOCUMENTS", (event, arg: string[]) => {
            dispatch({
                type: StoreActions.SetRecentDocuments,
                payload: {
                    recentDocuments: arg,
                },
            });
        });
        ipcRenderer.send("GET_RECENT_DOCUMENTS");
    }, [dispatch]);

    /*
    React.useEffect(() => {
        makeRequest("/read-settings", (data, error) => {
            if (error) {
                notifications.appendNotification({ type: NotificationType.ERROR, message: "Could not read settings." });
            } else {
                dispatch({
                    type: StoreActions.SetSettings,
                    payload: {
                        settings: data["settings"],
                    },
                });
            }
        });
        makeRequest(
            "/generate-json-schema",
            (data, error) => {
                if (error) {
                    return;
                }
                let jsonSchema: object = {};
                if (data["result"] === "success") {
                    jsonSchema = JSON.parse(data["schema"]);
                }
                dispatch({
                    type: StoreActions.SetJsonSchema,
                    payload: {
                        schema: jsonSchema,
                    },
                });
            },
            RequestMethod.POST,
            { pythonInterpreter: state.settings.find((el) => el.id === "pythonInterpreter")?.value }
        );
    }, []);

    React.useEffect(() => {
        makeRequest(
            "/save-settings",
            (data, error) => {
                if (error) {
                    notifications.appendNotification({
                        type: NotificationType.ERROR,
                        message: error,
                    });
                } else {
                    notifications.appendNotification({
                        type: NotificationType.SUCCESS,
                        message: data["message"],
                    });
                }
            },
            RequestMethod.PUT,
            state.settings
        );
    }, [state.settings]);
    */

    return <StoreContextProvider value={{ state, dispatch }}>{props.children}</StoreContextProvider>;
};

export const useStore = (): Context => useStoreContext();
