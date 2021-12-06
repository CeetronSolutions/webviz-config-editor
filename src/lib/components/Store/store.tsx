import React from "react";
import { FilesStore, SettingsStore, ConfigStore } from "./";

export const StoreProvider: React.FC = (props) => {
    return (
        <FilesStore.StoreProvider>
            <SettingsStore.StoreProvider>
                <ConfigStore.StoreProvider>{props.children}</ConfigStore.StoreProvider>
            </SettingsStore.StoreProvider>
        </FilesStore.StoreProvider>
    );
};
