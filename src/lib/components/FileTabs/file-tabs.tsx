import React from "react";

import { useStore } from "../Store/store";
import { File } from "../../types/file";
import { FileTab } from "./components/file-tab";

import "./file-tabs.css";

export type FileTabsProps = {
    onFileChange: (uuid: string) => void;
};

export const FileTabs: React.FC<FileTabsProps> = (props) => {
    const store = useStore();
    const [files, setFiles] = React.useState<File[]>([]);

    React.useEffect(() => {
        setFiles(store.state.files);
    }, [store.state.files]);

    return (
        <div className="FileTabs">
            {files.map((file) => (
                <FileTab key={file.uuid} uuid={file.uuid} onSelect={(uuid: string) => props.onFileChange(uuid)} />
            ))}
        </div>
    );
};
