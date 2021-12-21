import { app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import { initialize, enable } from "@electron/remote/main";
import * as fs from "fs";

let win: BrowserWindow | null = null;

initialize();

const appTitle = "Webviz Config Editor";

function openFile() {
    dialog
        .showOpenDialog({
            properties: ["openFile"],
            filters: [
                {
                    name: "Webviz Config Files",
                    extensions: ["yml", "yaml"],
                },
            ],
        })
        .then(function (fileObj) {
            if (!fileObj.canceled && win) {
                win.webContents.send("FILE_OPEN", fileObj.filePaths);
                for (const filePath of fileObj.filePaths) {
                    addRecentDocument(filePath);
                }
            }
        })
        .catch(function (err) {
            console.error(err);
        });
}

function getUserDataDir(): string {
    return app.getPath("userData");
}

function addRecentDocument(filePath: string) {
    const files = getRecentDocuments();
    if (files.includes(filePath)) {
        return;
    }
    if (files.length >= 5) {
        files.shift();
    }
    files.unshift(filePath);
    const recentDocumentsFile = path.join(getUserDataDir(), ".recent-documents");
    fs.appendFileSync(recentDocumentsFile, filePath + "\n");
    createMenu();
    if (win) {
        win.webContents.send("UPDATE_RECENT_DOCUMENTS", files);
    }
}

function sendRecentDocuments() {
    if (win) {
        win.webContents.send("UPDATE_RECENT_DOCUMENTS", getRecentDocuments());
    }
}

function getRecentDocuments(): string[] {
    const recentDocumentsFile = path.join(getUserDataDir(), ".recent-documents");
    if (!fs.existsSync(recentDocumentsFile)) {
        return [];
    }
    const content = fs.readFileSync(recentDocumentsFile);
    return content
        .toString()
        .split("\n")
        .filter((el) => fs.existsSync(el));
}

function clearRecentDocuments() {
    const recentDocumentsFile = path.join(getUserDataDir(), ".recent-documents");
    fs.writeFileSync(recentDocumentsFile, "");
    createMenu();
    if (win) {
        win.webContents.send("UPDATE_RECENT_DOCUMENTS", []);
    }
}

function createWindow() {
    const iconPath = path.join(__dirname, "..", "..", "public", "wce-icon.png");

    win = new BrowserWindow({
        title: appTitle,
        icon: iconPath,
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nodeIntegrationInWorker: true,
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

    /**
    if (isDev) {
        win.webContents.openDevTools();
    }
    */

    createMenu();

    ipcMain.on("FILE_OPEN", () => openFile());
    ipcMain.on("GET_RECENT_DOCUMENTS", () => sendRecentDocuments());
}

function createMenu() {
    if (win === null) return;
    const isMac = process.platform === "darwin";

    const listOfRecentDocuments = getRecentDocuments();
    const recentDocuments = listOfRecentDocuments.map((doc) => ({
        label: path.basename(doc),
        click() {
            (win as BrowserWindow).webContents.send("FILE_OPEN", [doc]);
        },
    }));
    recentDocuments.push({
        label: "Clear Recent",
        click() {
            clearRecentDocuments();
        },
    });

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
                    click() {
                        if (win) {
                            win.webContents.send("NEW_FILE");
                        }
                    },
                },
                {
                    label: "Open File...",
                    accelerator: "CmdOrCtrl+O",
                    click() {
                        openFile();
                    },
                },
                {
                    label: "Open Recent",
                    submenu: recentDocuments,
                },
                {
                    label: "Save",
                    accelerator: "CmdOrCtrl+S",
                    click() {
                        if (win) {
                            win.webContents.send("SAVE_FILE");
                        }
                    },
                },
                {
                    label: "Save as...",
                    accelerator: "CmdOrCtrl+Shift+S",
                    click() {
                        dialog
                            .showSaveDialog({
                                title: "Save file as...",
                                properties: ["createDirectory", "showOverwriteConfirmation"],
                                filters: [
                                    {
                                        name: "Webviz Config Files",
                                        extensions: ["yml", "yaml"],
                                    },
                                ],
                            })
                            .then(function (fileObj) {
                                if (!fileObj.canceled && win && fileObj.filePath) {
                                    win.webContents.send("SAVE_FILE_AS", fileObj.filePath);
                                }
                            })
                            .catch(function (err) {
                                console.error(err);
                            });
                        if (win) {
                            win.webContents.send("SAVE_FILE_AS");
                        }
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
