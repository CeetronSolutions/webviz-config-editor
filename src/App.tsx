/**
 * Copyright (c) 2021- Equinor ASA
 *
 * This source code is licensed under the MPLv2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { MainWindow } from "./lib/components/MainWindow";
import { ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import process from "process";

import "./App.css";
import { StoreProvider } from "./lib/components/Store/store";
import { NotificationsProvider } from "./lib/components/Notifications";
import { GetStartedDialog } from "./lib/components/GetStartedDialog";

export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function App(): JSX.Element {
    console.log(process.versions.v8);
    const [mode, setMode] = React.useState<"light" | "dark">(
        useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light"
    );
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
            },
        }),
        []
    );

    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
            }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <NotificationsProvider>
                    <StoreProvider>
                        <GetStartedDialog />
                        <MainWindow></MainWindow>
                    </StoreProvider>
                </NotificationsProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
