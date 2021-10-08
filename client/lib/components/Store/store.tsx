import React from "react";

import { Setting, Settings, compressSettings } from "../../utils/settings";
import { JsonSchemaParser } from "../../utils/json-schema-parser";
import { makeRequest, RequestMethod } from "../../utils/api";
import { createGenericContext } from "../../utils/generic-context";
import { NotificationType, useNotifications } from "../Notifications";

type ActionMap<M extends { [index: string]: { [key: string]: string | number | JsonSchemaParser | Setting[] } }> = {
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
    SetJsonSchemaParser = "SET_JSON_SCHEMA_PARSER",
}

export type StoreState = {
    editorValue: string;
    absPathToJsonSchema: string;
    jsonSchemaParser: JsonSchemaParser;
    settings: Setting[];
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
    [StoreActions.SetAbsPathToJsonSchema]: {
        absPath: string;
    };
    [StoreActions.SetJsonSchemaParser]: {
        parser: JsonSchemaParser;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];

const initialState: StoreState = {
    editorValue: "",
    absPathToJsonSchema: "",
    jsonSchemaParser: new JsonSchemaParser(),
    settings: compressSettings(Settings),
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    return {
        editorValue: initialState.editorValue,
        absPathToJsonSchema: initialState.absPathToJsonSchema,
        jsonSchemaParser: initialState.jsonSchemaParser,
        settings: initialState.settings,
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
        case StoreActions.SetAbsPathToJsonSchema:
            state.jsonSchemaParser.loadJsonSchema(action.payload.absPath);
            return {
                ...state,
                absPathToJsonSchema: action.payload.absPath,
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
        makeRequest("/read-settings", (data, error) => {
            if (error) {
                notifications.appendNotification({ type: NotificationType.ERROR, message: error });
            } else {
                dispatch({
                    type: StoreActions.SetSettings,
                    payload: {
                        settings: data["settings"],
                    },
                });
            }
        });
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

    return <StoreContextProvider value={{ state, dispatch }}>{props.children}</StoreContextProvider>;
};

export const useStore = (): Context => useStoreContext();
