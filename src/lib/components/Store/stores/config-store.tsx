import React from "react";
import path from "path";
import * as remote from "@electron/remote";

import { Config } from "../../../types/view-config";
import { createGenericContext } from "../../../utils/generic-context";
import { NotificationType, useNotifications } from "../../Notifications";
import fs from "fs";
import { LogEntry, LogEntryType } from "../../../types/log";

type ActionMap<
    M extends {
        [index: string]: { [key: string]: string | Config };
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

const getConfigPath = (): string => {
    return path.join(remote.app.getPath("userData"), ".config");
};

const writeConfig = (config: Config[]): boolean => {
    try {
        fs.writeFileSync(getConfigPath(), JSON.stringify(config));
        return true;
    } catch (error) {
        return false;
    }
};

const readConfig = (): Config[] => {
    try {
        const fileContent = fs.readFileSync(getConfigPath()).toString();
        const config = JSON.parse(fileContent);
        return config;
    } catch (error) {
        return [];
    }
};

export enum StoreActions {
    SetConfig = "SET_CONFIG",
}

export type StoreState = {
    config: Config[];
    log: LogEntry[];
};

type Payload = {
    [StoreActions.SetConfig]: {
        config: Config;
    };
};

export type Actions = ActionMap<Payload>[keyof ActionMap<Payload>];
const initialState: StoreState = {
    config: [],
    log: [],
};

export const StoreReducerInit = (initialState: StoreState): StoreState => {
    const config = readConfig();
    if (config.length > 0) {
        return {
            config: config,
            log: [],
        };
    }
    return initialState;
};

export const StoreReducer = (state: StoreState, action: Actions): StoreState => {
    switch (action.type) {
        case StoreActions.SetConfig:
            let newConfig: Config[] = [];
            if (state.config.find((config) => config.id === action.payload.config.id) !== undefined) {
                newConfig = state.config.map((config) => ({
                    id: config.id,
                    config: config.id === action.payload.config.id ? action.payload.config.config : config.config,
                }));
            } else {
                newConfig = state.config;
                newConfig.push(action.payload.config);
            }

            if (writeConfig(newConfig)) {
                return {
                    ...state,
                    config: newConfig,
                };
            } else {
                return state;
            }
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
