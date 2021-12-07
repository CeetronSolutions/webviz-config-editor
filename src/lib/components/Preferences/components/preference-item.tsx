import React from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    CircularProgress,
    Select,
    Button,
    MenuItem,
    Grid,
} from "@mui/material";
import * as fs from "fs";
import { execSync } from "child_process";
import * as which from "which";
import * as path from "path";
import { PythonShell, PythonShellError, Options } from "python-shell";

import { SettingMeta, Setting, FileFilter } from "../../../utils/settings";
import { SettingsStore } from "../../Store";

import "./preference-item.css";

const { app, dialog } = require("@electron/remote");

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
    const [tempValue, setTempValue] = React.useState<string | number | boolean>("");
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
        setLocalValue(store.state.settings.find((el: Setting) => el.id === props.id)?.value || "");
    }, []);

    React.useEffect(() => {
        setTempValue(localValue);
    }, [localValue]);

    React.useEffect(() => {
        if (props.type === "pythonInterpreter") {
            setLoadingState(PreferenceItemLoadingState.LOADING);
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
        } else if (props.type === "theme") {
            setLoadingState(PreferenceItemLoadingState.LOADING);
            const options: Options = {
                mode: "json",
                pythonPath: store.state.settings.find((el) => el.id === "python-interpreter")?.value.toString() || "",
            };
            PythonShell.run(
                path.resolve(app.getAppPath(), "python", "webviz_themes.py"),
                options,
                (err?: PythonShellError, output?: any[]) => {
                    if (output && output.length > 0 && "themes" in output[0]) {
                        setOptions(output[0]["themes"]);
                        setLoadingState(PreferenceItemLoadingState.LOADED);
                    } else {
                        setLoadingState(PreferenceItemLoadingState.ERROR);
                    }
                }
            );
        }
    }, [setOptions, setLoadingState, store.state.settings]);

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
                                    value: localValue as string | number | boolean,
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
                    value: localValue as string | number | boolean,
                },
            });
        }
    }, [localValue, props.id, props.type]);

    const handleValueChanged = (value: string | number | boolean) => {
        if (props.type === "pythonInterpreter") {
            if (value === "custom") {
                setDialogOpen(true);
                return;
            }
        }
        setLocalValue(value);
    };

    const openFileDialog = (filter: FileFilter[], defaultPath: string) => {
        dialog
            .showOpenDialog({
                properties: ["openFile"],
                filters: filter,
                defaultPath: defaultPath,
            })
            .then((fileObj: Electron.OpenDialogReturnValue) => {
                if (!fileObj.canceled) {
                    if (props.type === "pythonInterpreter") {
                        setTempValue(fileObj.filePaths[0]);
                    } else {
                        setLocalValue(fileObj.filePaths[0]);
                    }
                }
            });
    };

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
                                value={localValue as string | number | boolean}
                                onChange={(e) => handleValueChanged(e.target.value)}
                                className="PreferenceInput"
                                displayEmpty
                            >
                                {options.map((option) => (
                                    <MenuItem value={option}>{option}</MenuItem>
                                ))}
                                {!options.includes(localValue as string) && (
                                    <MenuItem value={localValue as string}>{localValue}</MenuItem>
                                )}
                                <MenuItem value="custom">Select from system...</MenuItem>
                            </Select>
                        )}
                        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                            <DialogTitle>Path to Python Interpreter</DialogTitle>
                            <DialogContent>
                                <DialogContentText>{props.description}</DialogContentText>
                                <Grid container flexDirection="row" alignItems="center" spacing={2}>
                                    <Grid item>
                                        <TextField margin="dense" type="text" aria-readonly value={tempValue} />
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            onClick={() =>
                                                openFileDialog(
                                                    [
                                                        {
                                                            name: "Python interpreter",
                                                            extensions: ["*"],
                                                        },
                                                    ],
                                                    path.dirname(localValue as string)
                                                )
                                            }
                                        >
                                            Change
                                        </Button>
                                    </Grid>
                                </Grid>
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
                                value={localValue as string | number | boolean}
                                onChange={(e) => handleValueChanged(e.target.value)}
                                className="PreferenceInput"
                                displayEmpty
                            >
                                <MenuItem value="">
                                    <em>Default</em>
                                </MenuItem>
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
                            <>
                                <TextField
                                    aria-readonly
                                    className="PreferenceInput"
                                    hiddenLabel
                                    value={localValue}
                                    size="small"
                                />
                                <Button
                                    onClick={() =>
                                        openFileDialog(props.fileFilter || [], path.dirname(localValue as string))
                                    }
                                >
                                    Select
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
