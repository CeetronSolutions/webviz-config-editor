import React from "react";
import { monaco } from "react-monaco-editor";
import { WithContext as ReactTags } from "react-tag-input";

import { FilesStore, SettingsStore } from "../Store";
import { LayoutObject, PluginArgumentObject } from "../../utils/yaml-parser";

import "./plugin-visualizer.css";
import { Paper, Switch, TextField, Typography } from "@mui/material";

export type PluginVisualizerType = {
    pluginData: LayoutObject;
};

export const PluginVisualizer: React.FC<PluginVisualizerType> = (props) => {
    const [selected, setSelected] = React.useState<boolean>(false);
    const store = FilesStore.useStore();
    const settingsStore = SettingsStore.useStore();

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
            type: FilesStore.StoreActions.UpdateSelection,
            payload: {
                selection: new monaco.Selection(props.pluginData.startLineNumber, 0, props.pluginData.endLineNumber, 0),
                source: FilesStore.UpdateSource.Preview,
            },
        });
    };

    const getIndent = (line: string): string => {
        let indent = 0;
        while (line.charAt(indent) === " ") {
            indent++;
        }
        return line.substring(0, indent);
    };

    const handleValueChanged = (
        data: LayoutObject,
        argument: PluginArgumentObject | undefined,
        key: string,
        newValue: any
    ) => {
        if (!data) {
            return;
        }
        let contentLines = store.state.currentEditorContent.split("\n");
        if (argument) {
            contentLines[argument.startLineNumber - 1] = contentLines[argument.startLineNumber - 1].replace(
                `${argument.name}: ${argument.value}`,
                `${argument.name}: ${newValue}`
            );
        } else {
            contentLines.splice(
                data.children[data.children.length - 1].endLineNumber,
                0,
                `${getIndent(
                    contentLines[data.children[data.children.length - 1].endLineNumber - 1]
                )}${key}: ${newValue}`
            );
        }
        store.dispatch({
            type: FilesStore.StoreActions.UpdateCurrentContentAndSetSelection,
            payload: {
                content: contentLines.join("\n"),
                source: FilesStore.UpdateSource.Preview,
                selection: new monaco.Selection(data.startLineNumber, 0, data.endLineNumber, 0),
            },
        });
    };

    const handleInputFocus = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
        argument: PluginArgumentObject | undefined
    ) => {
        if (!argument) {
            return;
        }
        store.dispatch({
            type: FilesStore.StoreActions.UpdateSelection,
            payload: {
                selection: new monaco.Selection(argument.startLineNumber, 0, argument.endLineNumber, 0),
                source: FilesStore.UpdateSource.Preview,
            },
        });
    };

    const makeInput = (
        data: LayoutObject,
        argument: PluginArgumentObject | undefined,
        key: string,
        type: string,
        required: boolean,
        value?: any,
        properties?: any
    ): React.ReactNode => {
        switch (type) {
            case "string":
                return (
                    <TextField
                        defaultValue={value}
                        required={required}
                        onChange={(e) => handleValueChanged(data, argument, key, e.target.value)}
                        onFocus={(e) => handleInputFocus(e, argument)}
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            case "boolean":
                return (
                    <Switch
                        defaultChecked={value === "true"}
                        required={required}
                        onChange={(e) => handleValueChanged(data, argument, key, e.target.checked)}
                    />
                );
            case "integer":
                return (
                    <TextField
                        required={required}
                        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                        type="number"
                        defaultValue={value}
                        onFocus={(e) => handleInputFocus(e, argument)}
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            case "array":
                return (
                    <ReactTags
                        tags={value}
                        handleAddition={() => {
                            return;
                        }}
                        handleDelete={() => {
                            return;
                        }}
                    />
                );
        }
        return <></>;
    };

    const renderPlugin = (data: LayoutObject): React.ReactNode => {
        if (data.type === "PLAINTEXT") {
            return (
                <>
                    <h3>Text</h3>
                    <TextField multiline defaultValue={data.name} />
                </>
            );
        }

        if (data.name) {
            const plugin = settingsStore.state.pluginParser.getPlugin(data.name);
            if (!plugin) {
                return <></>;
            }
            return (
                <>
                    <h3>{data.name}</h3>
                    <span className="PluginDescription">{plugin?.description || ""}</span>
                    {plugin.properties &&
                        Object.entries(plugin.properties).map(([key, value], index) => (
                            <>
                                <h4 style={{ whiteSpace: "nowrap" }}>
                                    {key}
                                    {plugin.requiredProperties !== undefined &&
                                        plugin.requiredProperties.includes(key) && (
                                            <Typography color="error" variant="inherit">
                                                *
                                            </Typography>
                                        )}
                                </h4>
                                {"type" in value &&
                                    makeInput(
                                        data,
                                        (data.children as PluginArgumentObject[]).find((el) => el.name === key),
                                        key,
                                        value.type,
                                        plugin.requiredProperties !== undefined &&
                                            plugin.requiredProperties.includes(key),
                                        (data.children as PluginArgumentObject[]).find((el) => el.name === key)?.value,
                                        value["properties"]
                                    )}
                            </>
                        ))}
                </>
            );
        }
        return <></>;
    };

    return (
        <Paper className={`Plugin${selected ? " Plugin--selected" : ""}`} onClick={selectPlugin}>
            {renderPlugin(props.pluginData)}
        </Paper>
    );
};
