import React from "react";
import { monaco } from "react-monaco-editor";

import { StoreActions, useStore, UpdateSource } from "../Store";
import { LayoutObject, PluginArgumentObject } from "../../utils/yaml-parser";

export type PluginVisualizerType = {
    pluginData: LayoutObject;
};

export const PluginVisualizer: React.FC<PluginVisualizerType> = (props) => {
    const [selected, setSelected] = React.useState<boolean>(false);
    const store = useStore();

    React.useEffect(() => {
        if (
            store.state.selectedYamlObject?.startLineNumber === props.pluginData.startLineNumber &&
            store.state.selectedYamlObject.endLineNumber === props.pluginData.endLineNumber
        ) {
            setSelected(true);
        } else {
            setSelected(false);
        }
    }, [store.state.selectedYamlObject, setSelected, props]);

    const selectPlugin = () => {
        store.dispatch({
            type: StoreActions.UpdateSelection,
            payload: {
                selection: new monaco.Selection(props.pluginData.startLineNumber, 0, props.pluginData.endLineNumber, 0),
                source: UpdateSource.Preview,
            },
        });
    };

    const renderPlugin = (data: LayoutObject): React.ReactNode => {
        if (typeof data === "string") {
            return data;
        }

        return (
            <>
                <h3>{data.name}</h3>
                <table>
                    <tbody>
                        {(data.children as PluginArgumentObject[]).map((child: PluginArgumentObject) => (
                            <tr key={child.id}>
                                <td>{child.name}</td>
                                <td>{JSON.stringify(child.value)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    return (
        <div
            className={`LivePreview__Plugin${selected ? " LivePreview__Plugin--selected" : ""}`}
            onClick={selectPlugin}
        >
            {renderPlugin(props.pluginData)}
        </div>
    );
};
