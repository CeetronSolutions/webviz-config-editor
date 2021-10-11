import React from "react";
import { Typography, Grid, Paper } from "@material-ui/core";

import { Settings } from "../../utils/settings";
import { PreferenceItem } from "./components/preference-item";

import "./preferences.css";

export const Preferences: React.FC = () => {
    return (
        <Grid className="Preferences" component="div" container direction="column" spacing={2}>
            {Object.keys(Settings).map((category: string) => (
                <React.Fragment key={category}>
                    <Grid item>
                        <Typography variant="h4" color="primary">
                            {category}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Paper className="PreferenceCategory">
                            {Settings[category].map((setting) => (
                                <PreferenceItem key={setting.id} {...setting} />
                            ))}
                        </Paper>
                    </Grid>
                </React.Fragment>
            ))}
        </Grid>
    );
};
