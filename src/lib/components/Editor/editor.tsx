import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-monokai";

import "./editor.css";
import { MenuItem, Select } from "@material-ui/core";

type EditorProps = {
    width: number;
    height: number;
};

export const Editor: React.FC<EditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState(16);
    const fontSizes = [12, 14, 16, 18, 20, 22, 24, 26];
    return (
        <>
            <AceEditor
                className="Editor"
                mode="yaml"
                theme="monokai"
                name="Editor"
                editorProps={{ $blockScrolling: true }}
                width={`${props.width}px`}
                height={`${props.height}px`}
                fontSize={fontSize}
            />
            <Select value={fontSize} label="Font size" onChange={(event) => setFontSize(event.target.value as number)}>
                {fontSizes.map((size) => (
                    <MenuItem value={size}>{`${size}`}</MenuItem>
                ))}
            </Select>
        </>
    );
};
