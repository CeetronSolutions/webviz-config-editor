import {ipcRenderer} from "electron";

import React from "react";

import {useMainProcessDataProvider} from "@components/MainProcessDataProvider/main-process-data-provider";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNewFile, clearRecentFiles} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {setInitialConfigurationDone} from "@redux/reducers/uiCoach";
import {openFile, saveFile} from "@redux/thunks";
import {saveFileAs} from "@redux/thunks/save-file";

import {FileExplorerOptions} from "@shared-types/file-explorer-options";
import {NotificationType} from "@shared-types/notifications";

import {useYamlParser} from "./yaml-parser";

export const IpcService: React.FC = props => {
    const dispatch = useAppDispatch();
    const yamlParser = useYamlParser();
    const activeFilePath = useAppSelector(state => state.files.activeFile);
    const associatedWithFile = useAppSelector(
        state =>
            state.files.files.find(el => el.filePath === state.files.activeFile)
                ?.associatedWithFile || false
    );
    const currentEditorValue = useAppSelector(
        state =>
            state.files.files.find(el => el.filePath === state.files.activeFile)
                ?.editorValue || ""
    );
    const mainProcessData = useMainProcessDataProvider();

    React.useEffect(() => {
        const listeners: string[] = [];
        const addListener = (
            channelName: string,
            func: (event?: Electron.IpcRendererEvent, args?: any) => void
        ) => {
            listeners.push(channelName);
            ipcRenderer.on(channelName, func);
        };
        addListener("file-opened", (_, args) => {
            openFile(args[0], dispatch, yamlParser);
        });
        addListener("new-file", () => {
            dispatch(addNewFile());
        });
        addListener("save-file", () => {
            if (associatedWithFile) {
                saveFile(activeFilePath, currentEditorValue, dispatch);
                return;
            }
            const options: FileExplorerOptions = {
                filters: [
                    {
                        name: "Webviz Config Files",
                        extensions: ["yml", "yaml"],
                    },
                ],
                action: "save",
                allowMultiple: false,
                title: "Save file as...",
                isDirectoryExplorer: false,
                defaultPath: mainProcessData.userHomeDir,
            };
            ipcRenderer.invoke("save-file", options).then(arg => {
                if (arg) {
                    saveFileAs(
                        activeFilePath,
                        arg,
                        currentEditorValue,
                        dispatch
                    );
                }
            });
        });
        addListener("save-file-as", () => {
            const options: FileExplorerOptions = {
                filters: [
                    {
                        name: "Webviz Config Files",
                        extensions: ["yml", "yaml"],
                    },
                ],
                action: "save",
                allowMultiple: false,
                title: "Save file as...",
                isDirectoryExplorer: false,
                defaultPath: associatedWithFile
                    ? activeFilePath
                    : mainProcessData.userHomeDir,
            };
            ipcRenderer.invoke("save-file", options).then(arg => {
                if (arg) {
                    saveFileAs(
                        activeFilePath,
                        arg,
                        currentEditorValue,
                        dispatch
                    );
                }
            });
        });
        addListener("clear-recent-files", () => {
            dispatch(clearRecentFiles());
        });
        addListener("recent-files-updated", () => {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Recent files successfully updated.",
                })
            );
        });

        addListener("recent-files-cleared", () => {
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Recent files successfully cleared.",
                })
            );
        });

        addListener("error", (_, errorMessage) => {
            dispatch(
                addNotification({
                    type: NotificationType.ERROR,
                    message: errorMessage,
                })
            );
        });

        addListener("debug:reset-init", () => {
            dispatch(setInitialConfigurationDone(false));
            dispatch(
                addNotification({
                    type: NotificationType.SUCCESS,
                    message: "Initial configuration state reset.",
                })
            );
        });

        return () => {
            listeners.forEach(channelName => {
                ipcRenderer.removeAllListeners(channelName);
            });
        };
    }, [
        activeFilePath,
        currentEditorValue,
        dispatch,
        mainProcessData,
        associatedWithFile,
        yamlParser,
    ]);

    return <>{props.children}</>;
};
