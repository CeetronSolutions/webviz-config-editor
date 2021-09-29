import React from "react";
import { AppBar, Container, CssBaseline, Toolbar, Button, Tabs, Tab, Tooltip, Grid } from "@material-ui/core";
import { Edit, PlayArrow, Settings } from "@material-ui/icons";
import useSize from "@react-hook/size";

import "./main-window.css";
import { Editor } from "../Editor";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    const [tab, setTab] = React.useState<number>(0);

    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const [editorWidth, editorHeight] = useSize(editorRef);

    return (
        <>
            <CssBaseline />
            <AppBar position="fixed" className="MenuBar">
                <Toolbar>
                    <Button color="inherit">File</Button>
                    <Button color="inherit">Edit</Button>
                </Toolbar>
            </AppBar>
            <div className="TabMenu">
                <Tabs orientation="vertical" value={tab} onChange={(_, newValue) => setTab(newValue)}>
                    <Tooltip title="Editor">
                        <Tab icon={<Edit />} className="MenuTab" />
                    </Tooltip>
                    <Tooltip title="Run">
                        <Tab icon={<PlayArrow />} className="MenuTab" />
                    </Tooltip>
                    <Tooltip title="Settings">
                        <Tab icon={<Settings />} className="MenuTab" />
                    </Tooltip>
                </Tabs>
            </div>
            <div className="Content" ref={editorRef}>
                {tab === 0 && <Editor width={editorWidth} height={editorHeight} />}
            </div>
        </>
    );
};
