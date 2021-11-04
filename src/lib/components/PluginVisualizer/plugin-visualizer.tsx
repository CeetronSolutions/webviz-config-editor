import React from "react";
import path from "path";
import fs from "fs";
import { Uri } from "monaco-editor";
import ReactMarkdown from "react-markdown";

import { useStore } from "../Store";

export type PluginVisualizerType = {
    pluginData: string | { [key: string]: any };
};

export const PluginVisualizer: React.FC<PluginVisualizerType> = (props) => {
    const store = useStore();

    const renderPlugin = (data: string | { [key: string]: any }): React.ReactNode => {
        if (typeof data === "string") {
            return data;
        } else if (typeof data === "object" && Object.keys(data).length > 0) {
            if (
                Object.keys(data)[0] === "BannerImage" &&
                typeof data["BannerImage"] === "object" &&
                Object.keys(data["BannerImage"]).includes("image")
            ) {
                return (
                    <img
                        src={Uri.parse(
                            path.join(
                                path.dirname(store.state.editorModel.uri.toString()),
                                data["BannerImage"]["image"]
                            )
                        ).toString()}
                        alt=""
                    />
                );
            }
            if (
                Object.keys(data)[0] === "Markdown" &&
                typeof data["Markdown"] === "object" &&
                Object.keys(data["Markdown"]).includes("markdown_file")
            ) {
                return (
                    <ReactMarkdown>
                        {fs
                            .readFileSync(
                                path.join(
                                    path.dirname(store.state.editorModel.uri.toString().replace("file://", "")),
                                    data["Markdown"]["markdown_file"]
                                )
                            )
                            .toString()}
                    </ReactMarkdown>
                );
            }
        }
        return Object.keys(data).map((el) => (
            <>
                <h3>{el}</h3>
                {Object.keys(data[el]).map((prop) => (
                    <table>
                        <tr>
                            <td>
                                <strong>{prop}: </strong>
                            </td>
                            <td>{JSON.stringify(data[el][prop])}</td>
                        </tr>
                    </table>
                ))}
            </>
        ));
    };

    return <div className="LivePreview__Plugin">{renderPlugin(props.pluginData)}</div>;
};
