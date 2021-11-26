import React from "react";
import jsYaml from "js-yaml";
import { uuid } from "uuidv4";
import { Menu } from "@webviz/core-components";
import {
    PropertyNavigationType,
    PropertyGroupType,
    PropertySectionType,
    PropertyPageType,
} from "@webviz/core-components/dist/components/Menu/types/navigation";

import { MenuWrapper } from "../MenuWrapper";
import { useStore } from "../Store";

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
    const [yamlValue, setYamlValue] = React.useState<Yaml>({});
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
        const title = store.state.yamlParser.getTitle();
        setTitle(title);
        setNavigationItems(store.state.yamlParser.getNavigationItems());
    }, [store.state.currentYamlObjects]);

    React.useEffect(() => {
        setCurrentPageContent(
            (store.state.yamlParser.getObjectById(currentPage.url)?.children as LayoutObject[]) || []
        );
    }, [currentPage, store.state.currentYamlObjects]);

    return (
        <div className="LivePreview">
            <div className="LivePreview__Title">{title || <i>No title defined yet</i>}</div>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <MenuWrapper
                        setProps={setCurrentPage}
                        navigationItems={navigationItems}
                        menuBarPosition="left"
                        inline={true}
                    />
                </div>
                <div className="LivePreview__Page">
                    {currentPageContent.map((plugin: { [key: string]: any }) => (
                        <PluginVisualizer pluginData={plugin} />
                    ))}
                </div>
            </div>
        </div>
    );
};
