import React from "react";
import path from "path";

import { Setting, Settings, compressSettings } from "../../utils/settings";
import { makeRequest, RequestMethod } from "../../utils/api";
import { createGenericContext } from "../../utils/generic-context";
import { NotificationType, useNotifications } from "../Notifications";
import { ipcRenderer } from "electron";
import fs from "fs";
import { editor, Uri } from "monaco-editor";

type ActionMap<M extends { [index: string]: { [key: string]: string | number | Setting[] | object } }> = {
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
    SetSettings = "SET_SETTINGS",
    SetSetting = "SET_SETTING",
    SetEditorValue = "SET_EDITOR_VALUE",
    SetEditorModel = "SET_EDITOR_MODEL",
    SetAbsPathToJsonSchema = "SET_JSON_SCHEMA",
    SetJsonSchema = "SET_JSON_SCHEMA",
}

export type StoreState = {
    editorValue: string;
    editorModel: editor.IModel;
    absPathToJsonSchema: string;
    settings: Setting[];
    jsonSchema: object;
};

type Payload = {
    [StoreActions.SetSettings]: {
        settings: Setting[];
    };
    [StoreActions.SetSetting]: {
        id: string;
        value: string | number;
    };
    [StoreActions.SetEditorValue]: {
        value: string;
    };
    [StoreActions.SetEditorModel]: {
        filePath: string;
    };
    [StoreActions.SetJsonSchema]: {
        schema: object;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialState: StoreState = {
    editorValue: "",
    editorModel: editor.createModel("", "yaml", undefined),
    absPathToJsonSchema: "",
    settings: compressSettings(Settings),
    jsonSchema: {},
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    return {
        editorValue: initialState.editorValue,
        editorModel: initialState.editorModel,
        absPathToJsonSchema: initialState.absPathToJsonSchema,
        settings: initialState.settings,
        jsonSchema: {},
    };
};

export const StoreReducer = (state: StoreState, action: Actions): StoreState => {
    switch (action.type) {
        case StoreActions.SetSettings:
            return {
                ...state,
                settings: action.payload.settings,
            };
            break;
        case StoreActions.SetSetting:
            const newSettings = state.settings.map((setting) => ({
                id: setting.id,
                value: setting.id === action.payload.id ? action.payload.value : setting.value,
            }));
            return {
                ...state,
                settings: newSettings,
            };
            break;
        case StoreActions.SetEditorModel:
            try {
                const fileContent = fs.readFileSync(action.payload.filePath).toString();
                ipcRenderer.send("APP_TITLE_CHANGE", path.basename(action.payload.filePath));
                return {
                    ...state,
                    editorModel: editor.createModel(fileContent, "yaml", Uri.parse(action.payload.filePath)),
                };
            } catch (e) {
                return state;
            }
        case StoreActions.SetEditorValue:
            return {
                ...state,
                editorValue: action.payload.value,
            };
            break;
        case StoreActions.SetJsonSchema:
            return {
                ...state,
                jsonSchema: action.payload.schema,
            };
            break;
        default:
            return state;
            break;
    }
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
                type: StoreActions.SetEditorModel,
                payload: {
                    filePath: args[0],
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
