import React from "react";
import { FilesStore, SettingsStore } from "./";

export const StoreProvider: React.FC = (props) => {
    return (
        <FilesStore.StoreProvider>
            <SettingsStore.StoreProvider>{props.children}</SettingsStore.StoreProvider>
        </FilesStore.StoreProvider>
    );
};
