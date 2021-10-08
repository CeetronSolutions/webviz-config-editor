import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Tabs, Tab, Typography, IconButton } from "@mui/material";
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
import { Preferences } from "../Preferences/preferences";

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

    const routes = ["/", "/play", "/settings"];

    return (
        <Router>
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
                        <Route
                            path="/"
                            render={(history) => (
                                <Tabs orientation="vertical" value={history.location.pathname}>
                                    <Tab
                                        icon={<Edit />}
                                        value={routes[0]}
                                        className="MenuTab"
                                        component={Link}
                                        to={routes[0]}
                                    />
                                    <Tab
                                        icon={<PlayArrow />}
                                        value={routes[1]}
                                        className="MenuTab"
                                        component={Link}
                                        to={routes[1]}
                                    />
                                    <Tab
                                        icon={<Settings />}
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
                                <Editor />
                                <LivePreview />
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
