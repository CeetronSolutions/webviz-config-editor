import React from "react";
import { Typography, TextField, Grid, CircularProgress } from "@material-ui/core";

import { SettingMeta } from "../../../utils/settings";
import { useStore, StoreActions } from "../../Store/store";
import { makeRequest, RequestMethod } from "../../../utils/api";
import { Autocomplete } from "@material-ui/lab";

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
        setLocalValue(store.state.settings.find((el) => el.id === props.id)?.value || "");
        makeRequest("/get-python-installations", (data, error) => {
            if (error) {
                setInstallations([]);
                setLoadingState(PreferenceItemLoadingState.ERROR);
            } else if (data["result"] === "success") {
                setInstallations(data["installations"]);
                setLoadingState(PreferenceItemLoadingState.LOADED);
            } else {
                setInstallations([]);
                setLoadingState(PreferenceItemLoadingState.ERROR);
            }
        });
    }, [setInstallations, setLoadingState]);

    React.useEffect(() => {
        setState({ state: PreferenceItemState.VALID, message: "" });
        if (props.type === "pythonInterpreter") {
            setState({ state: PreferenceItemState.VALIDATING, message: "" });
            makeRequest(
                "/check-if-python-interpreter",
                (data, error) => {
                    if (error) {
                        setState({ state: PreferenceItemState.INVALID, message: error });
                    } else if (data["result"] === "success") {
                        setState({ state: PreferenceItemState.VALID, message: "" });
                        store.dispatch({
                            type: StoreActions.SetSetting,
                            payload: {
                                id: props.id,
                                value: localValue,
                            },
                        });
                    } else {
                        setState({ state: PreferenceItemState.INVALID, message: data["message"] });
                    }
                },
                RequestMethod.POST,
                {
                    filePath: localValue,
                }
            );
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
