import React from "react";
import { PythonShell, Options, PythonShellError, NewlineTransformer } from "python-shell";
import * as path from "path";
import { CircularProgress } from "@mui/material";

import { SettingsStore } from "../Store";
import { useNotifications, NotificationType } from "../Notifications";

export const Play: React.FC = () => {
    const store = SettingsStore.useStore();
    const notifications = useNotifications();
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(true);
    const interval = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const buildWebviz = () => {
        const options: Options = {
            mode: "text",
            pythonPath: store.state.settings.find((el) => el.id === "python-interpreter")?.value.toString() || "",
            args: [
                "build",
                "/home/ruben/git-repos/webviz/webviz-config/examples/basic_example_advanced_menu.yaml",
                "--theme",
                "equinor",
            ],
        };
        const p = path.resolve(
            "/home/ruben/git-repos/webviz/config-editor/webviz-config-editor/",
            "python",
            "webviz_build.py"
        );
        const pythonShell = new PythonShell(
            path.resolve(
                "/home/ruben/git-repos/webviz/config-editor/webviz-config-editor/",
                "python",
                "webviz_build.py"
            ),
            options
        );
        pythonShell.on("message", (chunk) => {
            console.log(chunk);
        });
        pythonShell.on("error", (error) => {
            setHasError(true);
            notifications.appendNotification({
                type: NotificationType.ERROR,
                message: error.message,
            });
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
            {!loading && <iframe src="http://localhost:5000" style={{ width: "100%", height: "100%" }}></iframe>}
        </div>
    );
};
