import React from "react";
import { AppBar, Toolbar, Button } from "@material-ui/core";

type MainWindowProps = {};

export const MainWindow: React.FC<MainWindowProps> = (props) => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Button color="inherit">File</Button>
                <Button color="inherit">Edit</Button>
            </Toolbar>
        </AppBar>
    );
};
