import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Tabs, Tab, Typography, IconButton } from "@mui/material";
import { Edit, PlayArrow, Settings, Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import useSize from "@react-hook/size";
import path from "path";

import "./main-window.css";

import { ColorModeContext } from "../../../App";
import { Editor } from "../Editor";
import { LivePreview } from "../LivePreview/live-preview";
import { Preferences } from "../Preferences/preferences";
import { ResizablePanels } from "../ResizablePanels";

import { Size } from "../../types/size";
import { FilesStore } from "../Store";
import { Play } from "../Play";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    const [tab, setTab] = React.useState<number>(0);
    const [editorSize, setEditorSize] = React.useState<Size>({ width: 0, height: 0 });
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    const store = FilesStore.useStore();

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

    React.useEffect(() => {
        const file = store.state.files.find((el) => el.uuid === store.state.activeFileUuid);
        if (!file || file.editorModel.uri.toString() === "") {
            document.title = "Webviz Config Editor";
            return;
        }
        const filePath = file.editorModel.uri.path;
        document.title = path.basename(filePath) + " - Webviz Config Editor";
    }, [store.state.files, store.state.activeFileUuid]);

    const routes = ["/", "/play", "/settings"];

    return (
        <Router>
            <div className="MainWindow" ref={mainWindowRef}>
                <div className="ContentWrapper">
                    <div className="TabMenu">
                        <Route
                            path="/"
                            render={(history) => (
                                <Tabs orientation="vertical" value={history.location.pathname} color="inherit">
                                    <Tab
                                        icon={<Edit color="inherit" />}
                                        value={routes[0]}
                                        className="MenuTab"
                                        component={Link}
                                        to={routes[0]}
                                    />
                                    <Tab
                                        icon={<PlayArrow color="inherit" />}
                                        value={routes[1]}
                                        className="MenuTab"
                                        component={Link}
                                        to={routes[1]}
                                    />
                                    <Tab
                                        icon={<Settings color="inherit" />}
                                        value={routes[2]}
                                        className="MenuTab"
                                        component={Link}
                                        to={routes[2]}
                                    />
                                </Tabs>
                            )}
                        />
                    </div>
                    <div className="Content">
                        <Switch>
                            <Route exact path="/">
                                <ResizablePanels direction="horizontal">
                                    <Editor />
                                    <LivePreview />
                                </ResizablePanels>
                            </Route>
                            <Route path="/play">
                                <Play />
                            </Route>
                            <Route path="/settings">
                                <Preferences />
                            </Route>
                        </Switch>
                    </div>
                </div>
                <div className="Toolbar"></div>
            </div>
        </Router>
    );
};
