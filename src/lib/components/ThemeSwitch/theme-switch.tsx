import React from "react";
import { useTheme, IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

import { ColorModeContext } from "../../../App";

export const ThemeSwitch = () => {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    return (
        <IconButton onClick={colorMode.toggleColorMode} color="primary">
            {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
    );
};
