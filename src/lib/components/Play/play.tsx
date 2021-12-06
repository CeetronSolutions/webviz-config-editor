import React from "react";
import { PythonShell, Options } from "python-shell";
import * as path from "path";
import { CircularProgress } from "@mui/material";

import { FilesStore, SettingsStore } from "../Store";
import { useNotifications, NotificationType } from "../Notifications";
import { OpenInBrowser } from "@mui/icons-material";

import "./play.css";

const { app } = require("@electron/remote");

export const Play: React.FC = () => {
    const store = SettingsStore.useStore();
    const fileStore = FilesStore.useStore();
    const notifications = useNotifications();
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(true);
    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildWebviz = () => {
        const args = [
            "build",
            path.resolve(
                fileStore.state.files.find((file) => file.uuid === fileStore.state.activeFileUuid)?.editorModel.uri
                    .path || ""
            ),
        ];
        const theme = store.state.settings.find((setting) => setting.id === "theme")?.value || "";
        if (theme !== "") {
            args.push("--theme", theme as string);
        }
        const options: Options = {
            mode: "text",
            pythonPath: store.state.settings.find((el) => el.id === "python-interpreter")?.value.toString() || "",
            args: args,
        };
        const pythonShell = new PythonShell(path.resolve(app.getAppPath(), "python", "webviz_build.py"), options);
        pythonShell.on("message", (chunk) => {
            console.log(chunk);
        });
        pythonShell.on("error", (error) => {
            setHasError(true);
            notifications.appendNotification({
                type: NotificationType.ERROR,
                message: error.message,
            });
            console.log(error);
        });
        pythonShell.stdout.on("data", function (data) {
            console.log(data);
        });
        setHasError(false);
        if (interval.current) {
            clearInterval(interval.current);
        }
        interval.current = setInterval(() => {
            fetch("http://localhost:5000", {
                method: "GET",
            })
                .then((response) => {
                    if (response.status === 200 || response.status === 401) {
                        setLoading(false);
                        if (interval.current) {
                            clearInterval(interval.current);
                        }
                    } else {
                        setLoading(true);
                    }
                })
                .catch(() => setLoading(true));
        }, 1000);
        return pythonShell;
    };

    React.useEffect(() => {
        const pythonShell = buildWebviz();

        return () => {
            if (pythonShell) {
                pythonShell.kill();
            }
        };
    }, []);

    return (
        <div className="Play">
            {loading && <CircularProgress />}
            {!loading && (
                <>
                    <OpenInBrowser fontSize="large" color="action" />
                    <br />
                    <h4>Please wait until the browser window opens.</h4>
                </>
            )}
        </div>
    );
};
