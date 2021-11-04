import { app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import { initialize, enable } from "@electron/remote/main";

let win: BrowserWindow | null = null;

initialize();

const appTitle = "Webviz Config Editor";

function createWindow() {
    const iconPath = path.join(__dirname, "..", "..", "public", "wce-icon.png");

    win = new BrowserWindow({
        title: "Webviz Config Editor",
        icon: iconPath,
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

    ipcMain.on("APP_TITLE_CHANGE", (event, arg) => {
        win?.setTitle(`${arg} - ${appTitle}`);
    });

    const isMac = process.platform === "darwin";

    const template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          { role: "about" },
                          { type: "separator" },
                          { role: "services" },
                          { type: "separator" },
                          { role: "hide" },
                          { role: "hideOthers" },
                          { role: "unhide" },
                          { type: "separator" },
                          { role: "quit" },
                      ],
                  },
              ]
            : []),
        // { role: 'fileMenu' }
        {
            label: "File",
            submenu: [
                {
                    label: "New File",
                    accelerator: "CmdOrCtrl+N",
                },
                {
                    label: "Open File...",
                    accelerator: "CmdOrCtrl+O",
                    click() {
                        dialog
                            .showOpenDialog({
                                properties: ["openFile"],
                                filters: [{ name: "Webviz Config Files", extensions: ["yml", "yaml"] }],
                            })
                            .then(function (fileObj) {
                                if (!fileObj.canceled && win) {
                                    win.webContents.send("FILE_OPEN", fileObj.filePaths);
                                }
                            })
                            .catch(function (err) {
                                console.error(err);
                            });
                    },
                },
                isMac ? { role: "close" } : { role: "quit" },
            ],
        },
        // { role: 'editMenu' }
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                ...(isMac
                    ? [
                          { role: "pasteAndMatchStyle" },
                          { role: "delete" },
                          { role: "selectAll" },
                          { type: "separator" },
                          {
                              label: "Speech",
                              submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
                          },
                      ]
                    : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
            ],
        },
        // { role: 'viewMenu' }
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        // { role: 'windowMenu' }
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                ...(isMac
                    ? [{ type: "separator" }, { role: "front" }, { type: "separator" }, { role: "window" }]
                    : [{ role: "close" }]),
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Learn More",
                    click: async () => {
                        const { shell } = require("electron");
                        await shell.openExternal("https://electronjs.org");
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template as Array<MenuItemConstructorOptions>);
    Menu.setApplicationMenu(menu);
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
