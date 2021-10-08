import React from "react";
import { Typography, Grid, Paper } from "@mui/material";

import { Settings } from "../../utils/settings";
import { PreferenceItem } from "./components/preference-item";

import "./preferences.css";

export const Preferences: React.FC = () => {
    return (
        <Grid className="Preferences" component="div" container direction="column" spacing={2}>
            {Object.keys(Settings).map((category: string) => (
                <>
                    <Grid item>
                        <Typography variant="h4" color="primary">
                            {category}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Paper sx={{ p: 2 }}>
                            {Settings[category].map((setting) => (
                                <PreferenceItem {...setting} />
                            ))}
                        </Paper>
                    </Grid>
                </>
            ))}
        </Grid>
    );
};
