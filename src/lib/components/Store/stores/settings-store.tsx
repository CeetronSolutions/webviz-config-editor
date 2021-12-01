import React from "react";
import path from "path";
import * as remote from "@electron/remote";

import { Setting, Settings, compressSettings } from "../../../utils/settings";
import { createGenericContext } from "../../../utils/generic-context";
import { NotificationType, useNotifications } from "../../Notifications";
import fs from "fs";
import { LogEntry, LogEntryType } from "../../../types/log";

type ActionMap<
    M extends {
        [index: string]: { [key: string]: string | number | Setting[] | object | null };
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

const getSettingsPath = (): string => {
    return path.join(remote.app.getPath("userData"), ".settings");
};

const writeSettings = (settings: Setting[]): boolean => {
    try {
        fs.writeFileSync(getSettingsPath(), JSON.stringify(settings));
        return true;
    } catch (error) {
        return false;
    }
};

const readSettings = (): Setting[] => {
    try {
        const fileContent = fs.readFileSync(getSettingsPath()).toString();
        const settings = JSON.parse(fileContent);
        return settings;
    } catch (error) {
        return [];
    }
};

export enum StoreActions {
    SetSettings = "SET_SETTINGS",
    SetSetting = "SET_SETTING",
}

export type StoreState = {
    settings: Setting[];
    log: LogEntry[];
};

type Payload = {
    [StoreActions.SetSettings]: {
        settings: Setting[];
    };
    [StoreActions.SetSetting]: {
        id: string;
        value: string | number;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    settings: compressSettings(Settings),
    log: [],
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    const settings = readSettings();
    if (settings.length > 0) {
        return {
            settings: settings,
            log: [],
        };
    }
    return initialState;
};

export const StoreReducer = (state: StoreState, action: Actions): StoreState => {
    switch (action.type) {
        case StoreActions.SetSettings:
            writeSettings(action.payload.settings);
            return {
                ...state,
                settings: action.payload.settings,
            };
        case StoreActions.SetSetting:
            const newSettings = state.settings.map((setting) => ({
                id: setting.id,
                value: setting.id === action.payload.id ? action.payload.value : setting.value,
            }));
            writeSettings(newSettings);
            return {
                ...state,
                settings: newSettings,
            };
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

    return <StoreContextProvider value={{ state, dispatch }}>{props.children}</StoreContextProvider>;
};

export const useStore = (): Context => useStoreContext();
