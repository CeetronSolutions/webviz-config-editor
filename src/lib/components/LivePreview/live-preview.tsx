import React from "react";
import jsYaml from "js-yaml";

import { useStore } from "../Store";

import "./live-preview.css";

type LivePreviewProps = {};

interface Yaml {
    [key: string]: string | boolean | number | Yaml[] | Yaml;
}

export const LivePreview: React.FC<LivePreviewProps> = (props) => {
    const [yamlValue, setYamlValue] = React.useState<Yaml>({});
    const [renderResult, setRenderResult] = React.useState<string>("");
    const store = useStore();

    React.useEffect(() => {
        try {
            const obj = jsYaml.load(store.state.editorValue);
            if (obj && typeof obj === "object") {
                setYamlValue(obj as Yaml);
            }
        } catch (e) {
            void 0;
        }
    }, [store.state.editorValue]);

    return (
        <div className="LivePreview">
            <div className="LivePreview__Title">{yamlValue["title"] || <i>No title defined yet</i>}</div>
            {JSON.stringify(yamlValue)}
        </div>
    );
};
