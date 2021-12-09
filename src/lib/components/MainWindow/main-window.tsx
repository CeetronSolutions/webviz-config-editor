import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Tabs, Tab, Paper } from "@mui/material";
import { Edit, PlayArrow, Settings } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import path from "path";

import "./main-window.css";

import { ColorModeContext } from "../../../App";
import { Editor } from "../Editor";
import { LivePreview } from "../LivePreview/live-preview";
import { Preferences } from "../Preferences/preferences";
import { ResizablePanels } from "../ResizablePanels";

import { FilesStore } from "../Store";
import { Play } from "../Play";
import { ThemeSwitch } from "../ThemeSwitch";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    const theme = useTheme();
    const colorMode = React.useContext(ColorModeContext);
    const store = FilesStore.useStore();

    const mainWindowRef = React.useRef<HTMLDivElement | null>(null);

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
            <div
                className="MainWindow"
                ref={mainWindowRef}
                style={{ backgroundColor: theme.palette.background.default }}
            >
                <div className="ContentWrapper">
                    <Paper elevation={2} className="TabMenu" sx={{ borderRadius: 0 }}>
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
                        <div className="GlobalSettings">
                            <ThemeSwitch />
                        </div>
                    </Paper>
                    <div className="Content">
                        <Switch>
                            <Route exact path="/">
                                <ResizablePanels id="Editor-LivePreview" direction="horizontal">
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
