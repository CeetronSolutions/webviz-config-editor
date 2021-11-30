import React from "react";
import { Typography, TextField, Grid, CircularProgress } from "@mui/material";
import * as fs from "fs";
import { execSync } from "child_process";
import * as which from "which";

import { SettingMeta } from "../../../utils/settings";
import { useStore, StoreActions } from "../../Store/store";
import { Autocomplete } from "@mui/material";

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
    const store = useStore();
    const [localValue, setLocalValue] = React.useState<string | number>("");
    const [installations, setInstallations] = React.useState<string[]>([]);
    const [loadingState, setLoadingState] = React.useState<PreferenceItemLoadingState>(
        props.type === "pythonInterpreter" ? PreferenceItemLoadingState.LOADING : PreferenceItemLoadingState.LOADED
    );
    const [state, setState] = React.useState<{ state: PreferenceItemState; message: string }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setLoadingState(PreferenceItemLoadingState.LOADING);
        setLocalValue(store.state.settings.find((el) => el.id === props.id)?.value || "");
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
                                    setInstallations([]);
                                    setLoadingState(PreferenceItemLoadingState.ERROR);
                                }
                                if (resolvedPaths === undefined) {
                                    setInstallations([]);
                                } else if (resolvedPaths.constructor === Array) {
                                    setInstallations(resolvedPaths);
                                } else if (resolvedPaths.constructor === String) {
                                    setInstallations([resolvedPaths as string]);
                                }
                                setLoadingState(PreferenceItemLoadingState.LOADED);
                            }
                        );
                    } else {
                        if (resolvedPaths === undefined) {
                            setInstallations([]);
                        } else if (resolvedPaths.constructor === Array) {
                            setInstallations(resolvedPaths);
                        } else if (resolvedPaths.constructor === String) {
                            setInstallations([resolvedPaths as string]);
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
                            setInstallations([]);
                            setLoadingState(PreferenceItemLoadingState.ERROR);
                        }
                        if (resolvedPaths === undefined) {
                            setInstallations([]);
                        } else if (resolvedPaths.constructor === Array) {
                            setInstallations(resolvedPaths);
                        } else if (resolvedPaths.constructor === String) {
                            setInstallations([resolvedPaths as string]);
                        }
                        setLoadingState(PreferenceItemLoadingState.LOADED);
                    }
                );
            } catch (err) {
                setInstallations([]);
                setLoadingState(PreferenceItemLoadingState.ERROR);
            }
        }
    }, [setInstallations, setLoadingState]);

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
                                type: StoreActions.SetSetting,
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
                type: StoreActions.SetSetting,
                payload: {
                    id: props.id,
                    value: localValue,
                },
            });
        }
    }, [localValue]);

    return (
        <Grid className="PreferenceItem" container spacing={2} direction="column">
            <Grid item>
                <Typography variant="h6">{props.label}</Typography>
            </Grid>
            <Grid item>
                <Typography variant="body2">{props.description}</Typography>
            </Grid>
            <Grid item>
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
                        {loadingState !== PreferenceItemLoadingState.LOADING && (
                            <Autocomplete
                                id={props.id}
                                options={installations}
                                getOptionLabel={(option) => option}
                                onChange={(_: React.ChangeEvent<unknown>, newValue: string | null) =>
                                    setLocalValue(newValue !== null ? newValue : "")
                                }
                                value={localValue as string}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        type="string"
                                        value={localValue as string}
                                        error={state.state === PreferenceItemState.INVALID}
                                        helperText={state.message}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setLocalValue(e.target.value)
                                        }
                                    />
                                )}
                            />
                        )}
                    </>
                )}
            </Grid>
        </Grid>
    );
};
