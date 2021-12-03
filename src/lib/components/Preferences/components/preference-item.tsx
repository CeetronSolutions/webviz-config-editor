import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
    TextField,
    Grid,
    CircularProgress,
    Tooltip,
    Select,
    Button,
    MenuItem,
} from "@mui/material";
import * as fs from "fs";
import { execSync } from "child_process";
import * as which from "which";

import { SettingMeta, Setting } from "../../../utils/settings";
import { SettingsStore } from "../../Store";
import { Autocomplete } from "@mui/material";

import "./preference-item.css";

enum PreferenceItemState {
    VALIDATING = 0,
    VALID,
    INVALID,
}

enum PreferenceItemLoadingState {
    LOADING = 0,
    LOADED,
    ERROR,
}

export const PreferenceItem: React.FC<SettingMeta> = (props) => {
    const store = SettingsStore.useStore();
    const [localValue, setLocalValue] = React.useState<string | number | boolean>("");
    const [tempValue, setTempValue] = React.useState<string>("");
    const [options, setOptions] = React.useState<string[]>([]);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [loadingState, setLoadingState] = React.useState<PreferenceItemLoadingState>(
        props.type === "pythonInterpreter" ? PreferenceItemLoadingState.LOADING : PreferenceItemLoadingState.LOADED
    );
    const [state, setState] = React.useState<{ state: PreferenceItemState; message: string }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setLoadingState(PreferenceItemLoadingState.LOADING);
        setLocalValue(store.state.settings.find((el: Setting) => el.id === props.id)?.value || "");
        try {
            which.default(
                "python",
                { all: true },
                (err: Error | null, resolvedPaths: string | readonly string[] | undefined) => {
                    if (err) {
                        which.default(
                            "python3",
                            { all: true },
                            (err: Error | null, resolvedPaths: string | readonly string[] | undefined) => {
                                if (err) {
                                    setOptions([]);
                                    setLoadingState(PreferenceItemLoadingState.ERROR);
                                }
                                if (resolvedPaths === undefined) {
                                    setOptions([]);
                                } else if (resolvedPaths.constructor === Array) {
                                    setOptions(resolvedPaths);
                                } else if (resolvedPaths.constructor === String) {
                                    setOptions([resolvedPaths as string]);
                                }
                                setLoadingState(PreferenceItemLoadingState.LOADED);
                            }
                        );
                    } else {
                        if (resolvedPaths === undefined) {
                            setOptions([]);
                        } else if (resolvedPaths.constructor === Array) {
                            setOptions(resolvedPaths);
                        } else if (resolvedPaths.constructor === String) {
                            setOptions([resolvedPaths as string]);
                        }
                        setLoadingState(PreferenceItemLoadingState.LOADED);
                    }
                }
            );
        } catch (err) {
            try {
                which.default(
                    "python3",
                    { all: true },
                    (err: Error | null, resolvedPaths: string | readonly string[] | undefined) => {
                        if (err) {
                            setOptions([]);
                            setLoadingState(PreferenceItemLoadingState.ERROR);
                        }
                        if (resolvedPaths === undefined) {
                            setOptions([]);
                        } else if (resolvedPaths.constructor === Array) {
                            setOptions(resolvedPaths);
                        } else if (resolvedPaths.constructor === String) {
                            setOptions([resolvedPaths as string]);
                        }
                        setLoadingState(PreferenceItemLoadingState.LOADED);
                    }
                );
            } catch (err) {
                setOptions([]);
                setLoadingState(PreferenceItemLoadingState.ERROR);
            }
        }
    }, [setOptions, setLoadingState]);

    React.useEffect(() => {
        setState({ state: PreferenceItemState.VALID, message: "" });
        if (props.type === "pythonInterpreter") {
            setState({ state: PreferenceItemState.VALIDATING, message: "" });
            try {
                if (fs.existsSync(localValue as string)) {
                    try {
                        fs.accessSync(localValue as string, fs.constants.X_OK);
                        try {
                            execSync(`${localValue as string} -c "import sys; print(sys.path)"`);
                            setState({ state: PreferenceItemState.VALID, message: "" });
                            store.dispatch({
                                type: SettingsStore.StoreActions.SetSetting,
                                payload: {
                                    id: props.id,
                                    value: localValue,
                                },
                            });
                        } catch (error) {
                            setState({ state: PreferenceItemState.INVALID, message: "Invalid Python interpreter." });
                        }
                    } catch (error) {
                        setState({ state: PreferenceItemState.INVALID, message: "File is not executable." });
                    }
                } else {
                    setState({ state: PreferenceItemState.INVALID, message: "File does not exist." });
                }
            } catch (error) {
                setState({ state: PreferenceItemState.INVALID, message: "Invalid file path." });
            }
        } else {
            store.dispatch({
                type: SettingsStore.StoreActions.SetSetting,
                payload: {
                    id: props.id,
                    value: localValue,
                },
            });
        }
    }, [localValue]);

    const handleValueChanged = (value: string | number | boolean) => {
        if (props.type === "pythonInterpreter") {
            if (value === "custom") {
                setDialogOpen(true);
                return;
            }
        }
        setLocalValue(value);
    };

    const openPythonInterpreterDialog = () => {};

    return (
        <div className="PreferenceItem">
            <span className="PreferenceTitle">{props.label}</span>
            <span className="PreferenceDescription">{props.description}</span>
            <div className="PreferenceValue">
                {props.type === "string" && (
                    <TextField
                        id={props.id}
                        type={props.type}
                        value={localValue as string}
                        error={state.state === PreferenceItemState.INVALID}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
                    />
                )}
                {props.type === "pythonInterpreter" && (
                    <>
                        {loadingState === PreferenceItemLoadingState.LOADING && <CircularProgress />}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <Select
                                value={
                                    options.includes(localValue as string) || localValue === "" ? localValue : "custom"
                                }
                                onChange={(e) => handleValueChanged(e.target.value)}
                                className="PreferenceInput"
                                displayEmpty
                            >
                                {options.map((option) => (
                                    <MenuItem value={option}>{option}</MenuItem>
                                ))}
                                <MenuItem value="custom">Custom...</MenuItem>
                            </Select>
                        )}
                        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                            <DialogTitle>Path to Python Interpreter</DialogTitle>
                            <DialogContent>
                                <DialogContentText>{props.description}</DialogContentText>
                                <TextField
                                    margin="dense"
                                    type="file"
                                    variant="outlined"
                                    onChange={(e) => setTempValue(e.target.value)}
                                />
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={() => {
                                        setDialogOpen(false);
                                        setLocalValue(tempValue);
                                    }}
                                >
                                    Save
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
                {props.type === "theme" && (
                    <>
                        {loadingState === PreferenceItemLoadingState.LOADING && <CircularProgress />}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <Select
                                value={localValue}
                                onChange={(e) => handleValueChanged(e.target.value)}
                                className="PreferenceInput"
                                displayEmpty
                            >
                                {options.map((option) => (
                                    <MenuItem value={option}>{option}</MenuItem>
                                ))}
                            </Select>
                        )}
                    </>
                )}
                {props.type === "file" && (
                    <>
                        {loadingState === PreferenceItemLoadingState.LOADING && <CircularProgress />}
                        {loadingState === PreferenceItemLoadingState.LOADED && (
                            <TextField
                                className="PreferenceInput"
                                hiddenLabel
                                defaultValue={localValue}
                                variant="filled"
                                size="small"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
