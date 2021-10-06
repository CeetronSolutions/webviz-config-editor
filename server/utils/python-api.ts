import { exec, ExecException } from "child_process";

import { Error, LogEntryType } from "./../types/log";

export type PythonVersion = {
    version: string;
    execPath: string;
};

export const getDefaultPythonVersion = (callback: (version: PythonVersion | null, error?: Error) => void): void => {
    exec('python -c "import sys; print(sys.path)"', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
            callback(null, { type: LogEntryType.ERROR, datetimeMs: Date.now(), message: error.message });
            return;
        }
        if (stderr !== "") {
            callback(null, { type: LogEntryType.ERROR, datetimeMs: Date.now(), message: stderr });
            return;
        }

        const pathRegEx = /'(\/[a-zA-Z0-9_\.-]+)+(\/python[0-9_\.-]+)'/g;
        const versionRegEx = /^(([0-9]+\.)+[0-9]+)/;

        const pathes = pathRegEx.exec(stdout) || ["unknown"];
        const versions = versionRegEx.exec(stdout) || ["unknown"];

        callback({ version: versions[0], execPath: pathes[0] });
    });
};
