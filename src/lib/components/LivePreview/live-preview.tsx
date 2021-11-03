import React from "react";
import jsYaml from "js-yaml";
import { uuid } from "uuidv4";
import Frame from "react-frame-component";
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

type LivePreviewProps = {};

interface Yaml {
    [key: string]: string | boolean | number | Yaml[] | Yaml;
}

const parseNavigationItems = (
    items: { [key: string]: any }[],
    level: number
): [(PropertyGroupType | PropertyPageType | PropertySectionType)[], { [key: string]: any }] => {
    const navigationItems: (PropertyGroupType | PropertyPageType | PropertySectionType)[] = [];
    let pages: { [key: string]: any } = {};
    console.log(items);
    items.forEach((item) => {
        if (item.hasOwnProperty("section") && item["section"]) {
            const parseResult =
                "content" in item && item["content"] !== undefined
                    ? parseNavigationItems(item["content"], level + 1)
                    : [[], []];
            pages = { ...pages, ...parseResult[1] };
            navigationItems.push({
                type: "section",
                title: item["section"],
                icon: item["icon"],
                content: parseResult[0] as (PropertyGroupType | PropertyPageType)[],
            });
        } else if (item.hasOwnProperty("group") && item["group"]) {
            const parseResult =
                "content" in item && item["content"] !== undefined
                    ? parseNavigationItems(item["content"], level + 1)
                    : [[], []];
            pages = { ...pages, ...parseResult[1] };
            navigationItems.push({
                type: "group",
                title: item["group"],
                icon: item["icon"],
                content: parseResult[0] as (PropertyGroupType | PropertyPageType)[],
            });
        } else if (item["page"] && item["content"] !== undefined) {
            const id = uuid();
            navigationItems.push({
                type: "page",
                title: item["page"],
                icon: item["icon"],
                href: id,
            });
            if ("content" in item) {
                pages[id] = item["content"];
            }
        }
    });
    return [navigationItems, pages];
};

const parseMenu = (layout: { [key: string]: any }[]): [PropertyNavigationType, { [key: string]: any }] => {
    return parseNavigationItems(layout, 0) as [PropertyNavigationType, { [key: string]: any }];
};

type MenuReturnProps = {
    url: string;
};

export const LivePreview: React.FC<LivePreviewProps> = (props) => {
    const [yamlValue, setYamlValue] = React.useState<Yaml>({});
    const [navigationItems, setNavigationItems] = React.useState<PropertyNavigationType>([]);
    const [pages, setPages] = React.useState<{ [key: string]: any }>({});
    const [renderResult, setRenderResult] = React.useState<string>("");
    const [currentPage, setCurrentPage] = React.useState<MenuReturnProps>({
        url: "",
    });
    const store = useStore();

    React.useEffect(() => {
        try {
            const obj = jsYaml.load(store.state.editorValue);
            if (obj && typeof obj === "object") {
                setYamlValue(obj as Yaml);
                if ("layout" in obj) {
                    const [items, pages] = parseMenu((obj as Yaml)["layout"] as object[]);
                    setNavigationItems(items);
                    setPages(pages);
                    console.log(items);
                }
            }
        } catch (e) {
            void 0;
        }
    }, [store.state.editorValue, setNavigationItems, setPages]);

    return (
        <div className="LivePreview">
            <div className="LivePreview__Title">{yamlValue["title"] || <i>No title defined yet</i>}</div>
            <div className="LivePreview__Content">
                <div className="LivePreview__Menu">
                    <MenuWrapper setProps={setCurrentPage} navigationItems={navigationItems} menuBarPosition="left" />
                </div>
                <div className="LivePreview__Page">
                    {currentPage.url in pages &&
                        pages[currentPage.url].map((plugin: { [key: string]: any }) => (
                            <div className="LivePreview__Plugin">
                                {Object.keys(plugin).map((el) => (
                                    <>
                                        <h3>{el}</h3>
                                        {Object.keys(plugin[el]).map((prop) => (
                                            <table>
                                                <tr>
                                                    <td>
                                                        <strong>{prop}: </strong>
                                                    </td>
                                                    <td>{plugin[el][prop]}</td>
                                                </tr>
                                            </table>
                                        ))}
                                    </>
                                ))}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};
