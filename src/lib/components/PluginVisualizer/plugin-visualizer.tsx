import React from "react";
import path from "path";
import fs from "fs";
import { Uri } from "monaco-editor";
import ReactMarkdown from "react-markdown";

import { useStore } from "../Store";
import { LayoutObject, PluginArgumentObject } from "../../utils/yaml-parser";

export type PluginVisualizerType = {
    pluginData: LayoutObject;
};

export const PluginVisualizer: React.FC<PluginVisualizerType> = (props) => {
    const store = useStore();

    const renderPlugin = (data: LayoutObject): React.ReactNode => {
        if (typeof data === "string") {
            return data;
        }

        console.log(data.children);

        return (
            <>
                <h3>{data.name}</h3>
                <table>
                    <tbody>
                        {(data.children as PluginArgumentObject[]).map((child: PluginArgumentObject) => (
                            <tr>
                                <td>{child.name}</td>
                                <td>{JSON.stringify(child.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    return <div className="LivePreview__Plugin">{renderPlugin(props.pluginData)}</div>;
};
