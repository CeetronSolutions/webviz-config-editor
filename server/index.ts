import * as express from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

import { getDefaultPythonVersion, PythonVersion } from "./utils/python-api";

const PORT = process.env.PORT || process.env.REACT_APP_SERVER_PORT;

const app = express();

app.use(cors());

app.get("/default-python-version", (request: express.Request, response: express.Response) => {
    response.json({ version: "3.8.1", execPath: "/usr/lib/test/python3.8" });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
