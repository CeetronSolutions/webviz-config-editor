import React from "react";

import { FilesStore } from "../Store";
import { File } from "../../types/file";
import { FileTab } from "./components/file-tab";

import "./file-tabs.css";
import { useTheme } from "@mui/material";

export type FileTabsProps = {
    onFileChange: (uuid: string) => void;
};

export const FileTabs: React.FC<FileTabsProps> = (props) => {
    const store = FilesStore.useStore();
    const theme = useTheme();
    const [files, setFiles] = React.useState<File[]>([]);

    React.useEffect(() => {
        setFiles(store.state.files);
    }, [store.state.files]);

    return (
        <div className="FileTabs" style={{ backgroundColor: theme.shadows[1] }}>
            {files.map((file) => (
                <FileTab key={file.uuid} uuid={file.uuid} onSelect={(uuid: string) => props.onFileChange(uuid)} />
            ))}
        </div>
    );
};
