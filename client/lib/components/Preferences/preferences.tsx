import React from "react";
import { Typography } from "@mui/material";

import { Settings } from "../../utils/settings";
import { PreferenceItem } from "./components/preference-item";

import "./preferences.css";

export const Preferences: React.FC = () => {
    return (
        <div className="Preferences">
            {Object.keys(Settings).map((category: string) => (
                <>
                    <Typography variant="h4">{category}</Typography>
                    {Settings[category].map((setting) => (
                        <PreferenceItem {...setting} />
                    ))}
                </>
            ))}
        </div>
    );
};
