import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Button, Tabs, Tab, Typography, IconButton } from "@mui/material";
import { Edit, PlayArrow, Settings, Brightness4, Brightness7 } from "@mui/icons-material";
import { useTheme } from "@mui/material";
import useSize from "@react-hook/size";

import "./main-window.css";

import { ColorModeContext } from "../../../App";
import { YamlEditor } from "../Editor";

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
                                <YamlEditor />
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
