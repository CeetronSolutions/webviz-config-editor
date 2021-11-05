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
}

export type StoreState = {
    activeFileUuid: string;
    files: File[];
    settings: Setting[];
    log: LogEntry[];
    currentEditorContent: string;
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
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    return {
        activeFileUuid: initialState.activeFileUuid,
        files: initialState.files,
        settings: initialState.settings,
        log: initialState.log,
        currentEditorContent: initialState.currentEditorContent,
    };
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
            return {
                ...state,
                currentEditorContent:
                    state.files.find((file) => file.uuid === action.payload.uuid)?.editorModel.getValue() || "",
                activeFileUuid: action.payload.uuid,
            };
        case StoreActions.OpenFile:
            try {
                const fileContent = fs.readFileSync(action.payload.filePath).toString();
                const fileUuid = uuid();
                return {
                    ...state,
                    activeFileUuid: fileUuid,
                    currentEditorContent: fileContent,
                    files: [
                        ...state.files,
                        {
                            uuid: fileUuid,
                            unsavedChanges: true,
                            editorModel: editor.createModel(fileContent, "yaml", Uri.parse(action.payload.filePath)),
                            editorViewState: null,
                            selection: Selection.createWithDirection(0, 0, 0, 0, SelectionDirection.LTR),
                        },
                    ],
                };
            } catch (e) {
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
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
            };
        case StoreActions.CloseFile:
            const fileToDelete = state.files.find((file) => file.uuid === action.payload.uuid);
            if (fileToDelete) {
                fileToDelete.editorModel.dispose();
            }
            const newActiveFileUUid =
                action.payload.uuid === state.activeFileUuid
                    ? state.files[
                          Math.max(0, (state.files.findIndex((file) => file.uuid === action.payload.uuid) || 0) - 1)
                      ].uuid
                    : state.activeFileUuid;
            return {
                ...state,
                files: state.files.filter((file) => file.uuid !== action.payload.uuid),
                activeFileUuid: newActiveFileUUid,
                currentEditorContent:
                    state.files.find((file) => file.uuid === newActiveFileUUid)?.editorModel.getValue() || "",
            };
        case StoreActions.DeleteFile:
            try {
                const file = state.files.find((file) => file.uuid === action.payload.uuid);
                if (file) {
                    const filePath = file.editorModel.uri.path;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        if (file) {
                            file.editorModel.dispose();
                        }
                        const newActiveFileUUid =
                            action.payload.uuid === state.activeFileUuid
                                ? state.files[
                                      Math.max(
                                          0,
                                          (state.files.findIndex((file) => file.uuid === action.payload.uuid) || 0) - 1
                                      )
                                  ].uuid
                                : state.activeFileUuid;
                        return {
                            ...state,
                            files: state.files.filter((file) => file.uuid !== action.payload.uuid),
                            activeFileUuid: newActiveFileUUid,
                            currentEditorContent:
                                state.files.find((file) => file.uuid === newActiveFileUUid)?.editorModel.getValue() ||
                                "",
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
                console.log(e);
                return {
                    ...state,
                    log: [...state.log, { datetimeMs: Date.now(), type: LogEntryType.ERROR, message: e as string }],
                };
            }
        case StoreActions.UpdateCurrentContent:
            return {
                ...state,
                currentEditorContent: action.payload.content,
            };

        case StoreActions.UpdateSelection:
            const currentFile = state.files.find((file) => file.uuid === state.activeFileUuid);
            if (currentFile) {
                currentFile.selection = action.payload.selection;
                return {
                    ...state,
                    files: state.files.map((el) =>
                        el.uuid === state.activeFileUuid ? { ...el, unsavedChanges: true } : el
                    ),
                };
            }
            return state;
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
