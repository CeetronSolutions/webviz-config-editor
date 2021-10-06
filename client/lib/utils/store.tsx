import React from "react";

import { Setting, Settings, compressSettings } from "./settings";
import { JsonSchemaParser } from "./json-schema-parser";

type ActionMap<M extends { [index: string]: { [key: string]: string | number | JsonSchemaParser } }> = {
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
        case StoreActions.SetSetting:
            return {
                ...state,
                settings: state.settings.map((setting) => ({
                    id: setting.id,
                    value: setting.id === action.payload.id ? action.payload.value : setting.value,
                })),
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

const createGenericContext = <T extends unknown>() => {
    // Create a context with a generic parameter or undefined
    const genericContext = React.createContext<T | undefined>(undefined);

    // Check if the value provided to the context is defined or throw an error
    const useGenericContext = () => {
        const contextIsDefined = React.useContext(genericContext);
        if (!contextIsDefined) {
            throw new Error("useGenericContext must be used within a Provider");
        }
        return contextIsDefined;
    };

    return [useGenericContext, genericContext.Provider] as const;
};

const [useStoreContext, StoreContextProvider] = createGenericContext<Context>();

export const StoreProvider: React.FC = (props) => {
    const [state, dispatch] = React.useReducer(StoreReducer, initialState, StoreReducerInit);

    return <StoreContextProvider value={{ state, dispatch }}>{props.children}</StoreContextProvider>;
};

export const useStore = (): Context => useStoreContext();
