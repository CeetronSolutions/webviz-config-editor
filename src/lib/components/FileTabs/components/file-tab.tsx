import React from "react";
import path from "path";

import "./file-tab.css";
import { useStore, StoreActions } from "../../Store/store";
import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

export type FileTabProps = {
    uuid: string;
    onSelect: (uuid: string) => void;
};

export const FileTab: React.FC<FileTabProps> = (props) => {
    const [filename, setFilename] = React.useState<string>("");
    const [active, setActive] = React.useState<boolean>(false);
    const [modified, setModified] = React.useState<boolean>(false);
    const store = useStore();

    React.useEffect(() => {
        const file = store.state.files.find((el) => el.uuid === props.uuid);
        if (!file) {
            return;
        }
        setFilename(path.basename(file.editorModel.uri.path));
        setModified(file.unsavedChanges);
    }, [store.state.files, props.uuid]);

    React.useEffect(() => {
        setActive(props.uuid === store.state.activeFileUuid);
    }, [store.state.activeFileUuid, props.uuid]);

    const handleClickEvent = () => {
        props.onSelect(props.uuid);
    };

    const handleCloseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        store.dispatch({ type: StoreActions.CloseFile, payload: { uuid: props.uuid } });
    };

    return (
        <div
            className={`FileTab${active ? " FileTab--active" : ""}${modified ? " FileTab--modified" : ""}`}
            onClick={() => handleClickEvent()}
        >
            {filename}
            <div className="FileTab__CloseButton" onClick={(e) => handleCloseEvent(e)}>
                <Close fontSize="inherit" />
            </div>
        </div>
    );
};
