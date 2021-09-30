import React from "react";
import { AppBar, CssBaseline, Toolbar, Button, Tabs, Tab, Tooltip, Typography, IconButton } from "@mui/material";
import { Edit, PlayArrow, Settings } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import useSize from "@react-hook/size";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import "./main-window.css";

import { ColorModeContext } from "../../../App";
import { Editor } from "../Editor";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    const [tab, setTab] = React.useState<number>(0);
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const [editorWidth, editorHeight] = useSize(editorRef);

    return (
        <>
            <CssBaseline />
            <AppBar position="fixed" className="MenuBar">
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
            <div className="TabMenu">
                <Tabs orientation="vertical" value={tab} onChange={(_, newValue) => setTab(newValue)}>
                    <Tab icon={<Edit />} className="MenuTab" />
                    <Tab icon={<PlayArrow />} className="MenuTab" />
                    <Tab icon={<Settings />} className="MenuTab" />
                </Tabs>
            </div>
            <div className="Content" ref={editorRef}>
                {tab === 0 && <Editor width={editorWidth} height={editorHeight} />}
            </div>
        </>
    );
};
