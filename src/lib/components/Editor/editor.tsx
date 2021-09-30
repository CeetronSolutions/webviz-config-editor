import React from "react";
import AceEditor from "react-ace";
import ace, { Ace } from "ace-builds";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-monokai";
import { addCompleter } from "ace-builds/src-noconflict/ext-language_tools";

import "./editor.css";
import { MenuItem, Select } from "@mui/material";

type EditorProps = {
    width: number;
    height: number;
};

export const Editor: React.FC<EditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState(16);
    const fontSizes = [12, 14, 16, 18, 20, 22, 24, 26];

    const editorRef = React.useRef<AceEditor>(null);

    React.useEffect(() => {
        //const customMode = new CustomSqlMode();
        //editorRef.current.editor.getSession().setMode(customMode);
        addCompleter({
            getCompletions: (
                editor: Ace.Editor,
                session: Ace.EditSession,
                pos: Ace.Point,
                prefix: string,
                callback: Ace.CompleterCallback
            ): void => {
                callback(null, [
                    {
                        name: "test",
                        value: "test",
                        caption: "test",
                        meta: "test",
                        score: 1000,
                    },
                ]);
            },
        });
    });

    return (
        <>
            <AceEditor
                ref={editorRef}
                className="Editor"
                mode="yaml"
                theme="monokai"
                name="Editor"
                editorProps={{ $blockScrolling: true }}
                width={`${props.width}px`}
                height={`${props.height}px`}
                fontSize={fontSize}
                enableLiveAutocompletion={true}
                enableBasicAutocompletion={true}
            />
            <Select value={fontSize} label="Font size" onChange={(event) => setFontSize(event.target.value as number)}>
                {fontSizes.map((size) => (
                    <MenuItem value={size}>{`${size}`}</MenuItem>
                ))}
            </Select>
        </>
    );
};
