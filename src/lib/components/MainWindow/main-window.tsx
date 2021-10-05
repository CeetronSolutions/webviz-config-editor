import React from "react";
import { AppBar, CssBaseline, Toolbar, Button, Tabs, Tab, Typography, IconButton } from "@mui/material";
import { Edit, PlayArrow, Settings } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useSize from "@react-hook/size";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import "./main-window.css";

import { ColorModeContext } from "../../../App";
import { Editor } from "../Editor";

import { Size } from "../../types/size";
import { LivePreview } from "../LivePreview/live-preview";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    const [tab, setTab] = React.useState<number>(0);
    const [editorSize, setEditorSize] = React.useState<Size>({ width: 0, height: 0 });
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);
    const appBarRef = React.useRef<HTMLDivElement | null>(null);
    const [windowWidth, windowHeight] = useSize(mainWindowRef);
    const [appBarWidth, appBarHeight] = useSize(appBarRef);

    React.useEffect(() => {
        setEditorSize({
            width: windowWidth - 80,
            height: windowHeight - appBarHeight,
        });
    }, [windowWidth, windowHeight, appBarHeight, appBarWidth]);

    return (
        <div className="MainWindow" ref={mainWindowRef}>
            <AppBar position="relative" className="MenuBar" ref={appBarRef}>
                <Toolbar>
                    <Button color="inherit">File</Button>
                    <Button color="inherit">Edit</Button>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "center" }}>
                        Webviz Config Editor
                    </Typography>
                    <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                        {theme.palette.mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                </Toolbar>
            </AppBar>
            <div className="ContentWrapper">
                <div className="TabMenu" style={{ backgroundColor: theme.palette.background.paper }}>
                    <Tabs orientation="vertical" value={tab} onChange={(_, newValue) => setTab(newValue)}>
                        <Tab icon={<Edit />} className="MenuTab" />
                        <Tab icon={<PlayArrow />} className="MenuTab" />
                        <Tab icon={<Settings />} className="MenuTab" />
                    </Tabs>
                </div>
                <div className="Content">
                    {tab === 0 && <Editor />}
                    <LivePreview />
                </div>
            </div>
            <div className="Toolbar"></div>
        </div>
    );
};
