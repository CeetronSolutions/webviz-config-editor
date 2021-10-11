import * as express from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as which from "which";
import { execSync } from "child_process";

dotenv.config();

import { getDefaultPythonVersion, PythonVersion } from "./utils/python-api";

const PORT = process.env["PORT"] || process.env["REACT_APP_SERVER_PORT"];

const app = express();

app.use(cors());
app.use(express.json());

app.get("/default-python-version", (request: express.Request, response: express.Response) => {
    response.json({ version: "3.8.1", execPath: "/usr/lib/test/python3.8" });
});

app.post("/check-if-python-interpreter", (request: express.Request, response: express.Response) => {
    try {
        if (fs.existsSync(request.body.filePath)) {
            try {
                fs.accessSync(request.body.filePath, fs.constants.X_OK);
                try {
                    execSync(`${request.body.filePath} -c "import sys; print(sys.path)"`);
                    response.json({ result: "success", message: "" });
                } catch (error) {
                    response.json({ result: "error", message: "Invalid Python interpreter." });
                }
            } catch (error) {
                response.json({ result: "error", message: "File is not executable." });
            }
        } else {
            response.json({ result: "error", message: "File does not exist." });
        }
    } catch (error) {
        response.json({ result: "error", message: "Invalid file path." });
    }
});

app.post("/check-if-valid-json-schema", (request: express.Request, response: express.Response) => {
    try {
        if (fs.existsSync(request.body.filePath)) {
            try {
                fs.accessSync(request.body.filePath, fs.constants.X_OK);
                try {
                    execSync(`${request.body.filePath} -c "import sys; print(sys.path)"`);
                    response.json({ result: "success", message: "" });
                } catch (error) {
                    response.json({ result: "error", message: "Invalid Python interpreter." });
                }
            } catch (error) {
                response.json({ result: "error", message: "File is not executable." });
            }
        } else {
            response.json({ result: "error", message: "File does not exist." });
        }
    } catch (error) {
        response.json({ result: "error", message: "Invalid file path." });
    }
});

app.put("/save-settings", (request: express.Request, response: express.Response) => {
    try {
        fs.writeFileSync("./config/settings.json", JSON.stringify(request.body));
        response.json({ result: "success", message: "Settings saved." });
    } catch (error) {
        response.json({ result: "error", message: "Could not save settings.", details: error });
    }
});

app.get("/read-settings", (request: express.Request, response: express.Response) => {
    try {
        const fileContent = fs.readFileSync("./config/settings.json").toString();
        const settings = JSON.parse(fileContent);
        response.json({ result: "success", settings: settings });
    } catch (error) {
        response.json({ result: "error", message: "Could not load settings.", details: error });
    }
});

app.get("/get-python-installations", (request: express.Request, response: express.Response) => {
    try {
        which("python", { all: true }, (error: Error, resolvedPaths: string | readonly string[]) => {
            if (error) {
                response.json({ result: "error", message: "Could not find installations.", details: error });
                return;
            }
            response.json({ result: "success", installations: resolvedPaths });
        });
    } catch (error) {
        response.json({ result: "error", message: "Could not load settings.", details: error });
    }
});

app.post("/generate-json-schema", (request: express.Request, response: express.Response) => {
    try {
        const stdout = execSync(
            `${request.body.pythonInterpreter} -c "from webviz_config import command_line; command_line.main()" schema`
        ).toString();
        const regex = /(\/[a-zA-Z0-9_ -\\.]{1,})+/;
        const match = stdout.match(regex);
        if (match) {
            const fileContent = fs.readFileSync(match[0]).toString();
            const schema = JSON.parse(fileContent);
            response.json({ result: "success", schema: schema });
        } else {
            response.json({ result: "error", message: "Could not generate JSON schema.", details: stdout });
        }
    } catch (error) {
        response.json({ result: "error", message: "Could not load JSON schema.", details: error });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
