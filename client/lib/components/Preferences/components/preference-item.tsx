import React from "react";
import { Typography, TextField, Button } from "@mui/material";

import { SettingMeta } from "../../../utils/settings";
import { useStore } from "../../../utils/store";

export const PreferenceItem: React.FC<SettingMeta> = (props) => {
    const store = useStore();
    const [value, setValue] = React.useState<string | number>("");
    const [localValue, setLocalValue] = React.useState<string | number>("");

    React.useEffect(() => {
        setValue(store.state.settings.find((el) => el.id === props.id).value || "");
    }, [props.id, store.state]);

    return (
        <div className="PreferenceItem">
            <Typography variant="h6">{props.label}</Typography>
            <Typography variant="body2">{props.description}</Typography>
            {props.type === "string" && <TextField id={props.id} type={props.type} value={value as string} />}
            {props.type === "file" && (
                <>
                    <input
                        accept="inode/symlink"
                        id="raised-button-file"
                        multiple
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e: React.FormEvent<HTMLInputElement>) => setLocalValue(e.currentTarget.value)}
                    />
                    <TextField
                        InputProps={{
                            readOnly: true,
                        }}
                        value={localValue}
                    />
                    <label htmlFor="raised-button-file">
                        <Button component="span">Select</Button>
                    </label>
                </>
            )}
        </div>
    );
};
