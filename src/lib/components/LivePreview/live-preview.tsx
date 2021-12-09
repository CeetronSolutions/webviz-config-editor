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

type LivePreviewProps = {};

interface Yaml {
    [key: string]: string | boolean | number | Yaml[] | Yaml;
}

type MenuReturnProps = {
    url: string;
};

export const LivePreview: React.FC<LivePreviewProps> = (props) => {
    const [navigationItems, setNavigationItems] = React.useState<PropertyNavigationType>([]);
    const [title, setTitle] = React.useState<string>("");
    const [currentPageContent, setCurrentPageContent] = React.useState<LayoutObject[]>([]);
    const store = FilesStore.useStore();

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
        if (store.state.updateSource === FilesStore.UpdateSource.Preview) {
            return;
        }
        const object = store.state.yamlParser.getObjectById(store.state.currentPageId);
        if (object) {
            store.dispatch({
                type: FilesStore.StoreActions.UpdateSelection,
                payload: {
                    selection: new monaco.Selection(object.startLineNumber, 0, object.endLineNumber, 0),
                    source: FilesStore.UpdateSource.Preview,
                },
            });
        }
        setCurrentPageContent((object?.children as LayoutObject[]) || []);
    }, [store.state.currentPageId, store.state.updateSource]);

    return (
        <div className="LivePreview">
            <div className="LivePreview__Title">{title || <i>No title defined yet</i>}</div>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <MenuWrapper
                        setProps={(props) =>
                            store.dispatch({
                                type: FilesStore.StoreActions.SetCurrentPage,
                                payload: { pageId: props.url },
                            })
                        }
                        navigationItems={navigationItems}
                        menuBarPosition="left"
                        inline={true}
                    />
                </div>
                <div className="LivePreview__Page">
                    {currentPageContent.map((plugin: LayoutObject) => (
                        <PluginVisualizer key={plugin.id} pluginData={plugin} />
                    ))}
                </div>
            </div>
        </div>
    );
};
