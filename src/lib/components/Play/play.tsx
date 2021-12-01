import React from "react";
import { PythonShell, Options, PythonShellError } from "python-shell";
import * as path from "path";

import { SettingsStore } from "../Store";
import { useNotifications, NotificationType } from "../Notifications";

export const Play: React.FC = () => {
    const store = SettingsStore.useStore();
    const notifications = useNotifications();
    const [hasError, setHasError] = React.useState<boolean>(false);
    const [pythonShell, setPythonShell] = React.useState<PythonShell | null>(null);

    const buildWebviz = () => {
        const options: Options = {
            mode: "text",
            pythonPath: store.state.settings.find((el) => el.id === "python-interpreter")?.value.toString() || "",
            args: ["build", "./examples/basic_example_advanced_menu.yaml", "--theme", "equinor"],
        };
        setPythonShell(new PythonShell(path.join(__dirname, "python", "webviz_build.py"), options));
        setHasError(false);
    };

    React.useEffect(() => {
        if (pythonShell) {
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
        }
    }, [pythonShell]);

    React.useEffect(() => {
        buildWebviz();

        return () => {
            if (pythonShell) {
                pythonShell.end((err, code, signal) => {
                    return;
                });
            }
        };
    }, []);

    return (
        <div className="Play">
            <iframe src=""></iframe>
        </div>
    );
};
