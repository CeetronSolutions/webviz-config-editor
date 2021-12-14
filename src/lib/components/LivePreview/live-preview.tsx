import React from "react";
import { monaco } from "react-monaco-editor";
import {
    PropertyNavigationType,
    PropertyGroupType,
    PropertySectionType,
    PropertyPageType,
} from "@webviz/core-components/dist/components/Menu/types/navigation";

import { MenuWrapper } from "../MenuWrapper";
import { FilesStore, SettingsStore } from "../Store";

import "./live-preview.css";
import { ErrorBoundary } from "../ErrorBoundary";
import { PluginVisualizer } from "../PluginVisualizer";
import { LayoutObject, YamlObjectType } from "../../utils/yaml-parser";
import { Grid, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import { Edit, Visibility } from "@mui/icons-material";
import { UpdateSource } from "../Store/stores/files-store";

type LivePreviewProps = {};

interface Yaml {
    [key: string]: string | boolean | number | Yaml[] | Yaml;
}

type MenuReturnProps = {
    url: string;
};

export enum PreviewMode {
    Edit = "EDIT",
    View = "VIEW",
}

export const LivePreview: React.FC<LivePreviewProps> = (props) => {
    const [navigationItems, setNavigationItems] = React.useState<PropertyNavigationType>([]);
    const [title, setTitle] = React.useState<string>("");
    const [mode, setMode] = React.useState<PreviewMode>(PreviewMode.View);
    const [currentPageContent, setCurrentPageContent] = React.useState<LayoutObject[]>([]);
    const store = FilesStore.useStore();

    const theme = useTheme();

    React.useEffect(() => {
        if (store.state.updateSource !== FilesStore.UpdateSource.Editor) {
            return;
        }
        if (store.state.currentYamlObjects.length === 0) {
            setNavigationItems([]);
            setCurrentPageContent([]);
            setTitle("");
            return;
        }

        setTitle(store.state.yamlParser.getTitle());
        setNavigationItems(store.state.yamlParser.getNavigationItems());
    }, [store.state.currentYamlObjects, store.state.updateSource]);

    React.useEffect(() => {
        if (store.state.updateSource === UpdateSource.Plugin) {
            return;
        }
        const object = store.state.yamlParser.getObjectById(store.state.currentPageId);
        setCurrentPageContent((object?.children as LayoutObject[]) || []);
    }, [store.state.currentPageId, store.state.updateSource]);

    return (
        <div className="LivePreview">
            <Paper square className="LivePreview__Title" style={{ backgroundColor: theme.palette.background.paper }}>
                <Stack spacing={4} direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1">{title || <em>No title defined yet</em>}</Typography>
                    <ToggleButtonGroup value={mode} exclusive onChange={(e, v) => setMode(v)} aria-label="preview mode">
                        <ToggleButton value={PreviewMode.Edit} aria-label="edit mode">
                            <Edit />
                        </ToggleButton>
                        <ToggleButton value={PreviewMode.View} aria-label="view mode">
                            <Visibility />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Paper>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <MenuWrapper
                        setProps={(props) =>
                            store.dispatch({
                                type: FilesStore.StoreActions.SetCurrentPage,
                                payload: { pageId: props.url, source: FilesStore.UpdateSource.Preview },
                            })
                        }
                        navigationItems={navigationItems}
                        menuBarPosition="left"
                        inline={true}
                    />
                </div>
                <div className="LivePreview__Page">
                    {currentPageContent.map((plugin: LayoutObject) => (
                        <PluginVisualizer key={plugin.id} pluginData={plugin} mode={mode} />
                    ))}
                </div>
            </div>
        </div>
    );
};
