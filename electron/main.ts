import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import { initialize, enable } from "@electron/remote/main";

let win: BrowserWindow | null = null;

initialize();

console.log(__dirname);

function createWindow() {
    win = new BrowserWindow({
        title: "Webviz Config Editor",
        icon: __dirname + "/../../public/webviz.ico",
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
            nodeIntegrationInSubFrames: true,
            webSecurity: false,
        },
    });

    enable(win.webContents);

    if (isDev) {
        win.loadURL("http://localhost:3000");
    } else {
        // 'build/index.html'
        win.loadURL(`file://${__dirname}/../index.html`);
    }

    win.on("closed", () => (win = null));

    // Hot Reloading
    if (isDev) {
        // 'node_modules/.bin/electronPath'
        require("electron-reload")(__dirname, {
            electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron"),
            forceHardReset: true,
            hardResetMethod: "exit",
        });
    }

    // DevTools
    installExtension(REACT_DEVELOPER_TOOLS)
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));

    if (isDev) {
        win.webContents.openDevTools();
    }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (win === null) {
        createWindow();
    }
});
