export interface Setting {
    id: string;
    value: string | number | boolean;
}

export type FileFilter = {
    name: string;
    extensions: string[];
};

export interface SettingMeta {
    id: string;
    label: string;
    description: string;
    type: "string" | "number" | "file" | "pythonInterpreter" | "theme";
    defaultValue: string | number | boolean;
    fileFilter?: FileFilter[];
}

export const Settings: { [key: string]: SettingMeta[] } = {
    Python: [
        {
            id: "python-interpreter",
            label: "Interpreter",
            description: "Select the interpreter that you are using with Webviz.",
            type: "pythonInterpreter",
            defaultValue: "",
        },
    ],
    Webviz: [
        {
            id: "schema",
            label: "Webviz Schema",
            description: "Select the Webviz schema file.",
            type: "file",
            defaultValue: "",
            fileFilter: [
                {
                    name: "Webviz JSON Schema File",
                    extensions: ["json"],
                },
            ],
        },
        {
            id: "theme",
            label: "Theme",
            description: "Select the theme you want to use with Webviz.",
            type: "theme",
            defaultValue: "",
        },
    ],
};

export const compressSettings = (settings: { [key: string]: SettingMeta[] }): Setting[] => {
    const compressedSettings: Setting[] = [];
    for (const category in settings) {
        settings[category].forEach((setting) => {
            compressedSettings.push({
                id: setting.id,
                value: setting.defaultValue,
            });
        });
    }
    return compressedSettings;
};
