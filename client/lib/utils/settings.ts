export interface Setting {
    id: string;
    value: string | number;
}

export interface SettingMeta {
    id: string;
    label: string;
    description: string;
    type: "string" | "number" | "file";
    defaultValue: string | number;
}

export const Settings: { [key: string]: SettingMeta[] } = {
    Python: [
        {
            id: "python-interpreter",
            label: "Interpreter",
            description: "Select the interpreter that you are using with Webviz.",
            type: "file",
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
