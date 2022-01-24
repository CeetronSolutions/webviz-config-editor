import {Close} from "@mui/icons-material";
import {useTheme} from "@mui/material";

import React from "react";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {closeFile} from "@redux/reducers/files";

import path from "path";

import "./file-tab.css";

export type FileTabProps = {
    filePath: string;
    onSelect: (filePath: string) => void;
};

export const FileTab: React.FC<FileTabProps> = props => {
    const [filename, setFilename] = React.useState<string>("");
    const [active, setActive] = React.useState<boolean>(false);
    const [modified, setModified] = React.useState<boolean>(false);

    const theme = useTheme();
    const dispatch = useAppDispatch();
    const file = useAppSelector(state =>
        state.files.files.find(el => el.filePath === props.filePath)
    );
    const activeFilePath = useAppSelector(state => state.files.activeFile);

    React.useEffect(() => {
        if (!file) {
            return;
        }
        setFilename(path.basename(file.filePath));
        setModified(file.unsavedChanges);
    }, [file]);

    React.useEffect(() => {
        setActive(props.filePath === activeFilePath);
    }, [activeFilePath, props.filePath]);

    const handleClickEvent = () => {
        props.onSelect(props.filePath);
    };

    const handleCloseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(closeFile(props.filePath));
    };

    return (
        <div
            className={`FileTab${active ? " FileTab--active" : ""}${
                modified ? " FileTab--modified" : ""
            }`}
            onClick={() => handleClickEvent()}
            style={{
                backgroundColor: active
                    ? theme.palette.action.disabledBackground
                    : theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
        >
            {filename}
            <div
                className="FileTab__CloseButton"
                onClick={e => handleCloseEvent(e)}
            >
                <Close fontSize="inherit" />
            </div>
        </div>
    );
};
