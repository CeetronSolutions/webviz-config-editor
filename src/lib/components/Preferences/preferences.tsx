import React from "react";
import { useTheme } from "@mui/material";

import { Settings } from "../../utils/settings";
import { PreferenceItem } from "./components/preference-item";

import "./preferences.css";

export const Preferences: React.FC = () => {
    const theme = useTheme();
    return (
        <div
            className="Preferences"
            style={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}
        >
            {Object.keys(Settings).map((category: string) => (
                <React.Fragment key={category}>
                    <div className="Preferences__Category">{category}</div>
                    <div className="Preferences__CategoryContent">
                        {Settings[category].map((setting) => (
                            <PreferenceItem key={setting.id} {...setting} />
                        ))}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};
