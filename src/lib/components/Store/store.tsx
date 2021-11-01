import React from "react";

import { Setting, Settings, compressSettings } from "../../utils/settings";
import { makeRequest, RequestMethod } from "../../utils/api";
import { createGenericContext } from "../../utils/generic-context";
import { NotificationType, useNotifications } from "../Notifications";

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
    SetAbsPathToJsonSchema = "SET_JSON_SCHEMA",
    SetJsonSchema = "SET_JSON_SCHEMA",
}

export type StoreState = {
    editorValue: string;
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
    [StoreActions.SetJsonSchema]: {
        schema: object;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialState: StoreState = {
    editorValue: "",
    absPathToJsonSchema: "",
    settings: compressSettings(Settings),
    jsonSchema: {},
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    return {
        editorValue: initialState.editorValue,
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
