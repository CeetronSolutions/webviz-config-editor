import React from "react";
import { Typography, TextField, Grid } from "@mui/material";

import { SettingMeta } from "../../../utils/settings";
import { useStore, StoreActions } from "../../Store/store";
import { makeRequest, RequestMethod } from "../../../utils/api";

enum PreferenceItemState {
    VALIDATING = 0,
    VALID,
    INVALID,
}

export const PreferenceItem: React.FC<SettingMeta> = (props) => {
    const store = useStore();
    const [localValue, setLocalValue] = React.useState<string | number>("");
    const [state, setState] = React.useState<{ state: PreferenceItemState; message: string }>({
        state: PreferenceItemState.VALID,
        message: "",
    });

    React.useEffect(() => {
        setLocalValue(store.state.settings.find((el) => el.id === props.id)?.value || "");
    }, []);

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
                        color={state.state === PreferenceItemState.VALID ? "success" : "error"}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
                    />
                )}
                {props.type === "pythonInterpreter" && (
                    <TextField
                        id={props.id}
                        type="string"
                        value={localValue as string}
                        error={state.state === PreferenceItemState.INVALID}
                        color={state.state === PreferenceItemState.VALID ? "success" : "error"}
                        helperText={state.message}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
                    />
                )}
            </Grid>
        </Grid>
    );
};
