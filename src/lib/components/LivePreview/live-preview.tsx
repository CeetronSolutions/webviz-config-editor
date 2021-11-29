import React from "react";
import jsYaml from "js-yaml";
import { monaco } from "react-monaco-editor";
import { uuid } from "uuidv4";
import { Menu } from "@webviz/core-components";
import {
    PropertyNavigationType,
    PropertyGroupType,
    PropertySectionType,
    PropertyPageType,
} from "@webviz/core-components/dist/components/Menu/types/navigation";

import { MenuWrapper } from "../MenuWrapper";
import { useStore, StoreActions, UpdateSource } from "../Store";

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
    const [currentPage, setCurrentPage] = React.useState<MenuReturnProps>({
        url: "",
    });
    const store = useStore();

    React.useEffect(() => {
        if (store.state.currentYamlObjects.length === 0) {
            setNavigationItems([]);
            setCurrentPageContent([]);
            setTitle("");
            return;
        }
        setTitle(store.state.yamlParser.getTitle());
        setNavigationItems(store.state.yamlParser.getNavigationItems());
    }, [store.state.currentYamlObjects]);

    React.useEffect(() => {
        const object = store.state.yamlParser.getObjectById(store.state.currentPageId);
        if (object) {
            store.dispatch({
                type: StoreActions.UpdateSelection,
                payload: {
                    selection: new monaco.Selection(object.startLineNumber, 0, object.endLineNumber, 0),
                    source: UpdateSource.Preview,
                },
            });
        }
        setCurrentPageContent((object?.children as LayoutObject[]) || []);
    }, [store.state.currentPageId, store.state.currentYamlObjects]);

    return (
        <div className="LivePreview">
            <div className="LivePreview__Title">{title || <i>No title defined yet</i>}</div>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <MenuWrapper
                        setProps={(props) =>
                            store.dispatch({ type: StoreActions.SetCurrentPage, payload: { pageId: props.url } })
                        }
                        navigationItems={navigationItems}
                        menuBarPosition="left"
                        inline={true}
                    />
                </div>
                <div className="LivePreview__Page">
                    {currentPageContent.map((plugin: LayoutObject) => (
                        <PluginVisualizer pluginData={plugin} />
                    ))}
                </div>
            </div>
        </div>
    );
};
