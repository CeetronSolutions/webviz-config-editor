import React from "react";
import AceEditor from "react-ace";
import { Ace } from "ace-builds";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-monokai";
import { addCompleter } from "ace-builds/src-noconflict/ext-language_tools";

import { useStore, StoreActions } from "../Store/store";

import "./editor.css";

type EditorProps = {};

export const Editor: React.FC<EditorProps> = (props) => {
    const [fontSize, setFontSize] = React.useState(1);
    const [currentLine, setCurrentLine] = React.useState(0);
    const [currentColumn, setCurrentColumn] = React.useState(0);
    const [currentSelection, setCurrentSelection] = React.useState<number | undefined>(undefined);

    const store = useStore();

    const fontSizes = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2];

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

    const handleChange = (value: string) => {
        store.dispatch({ type: StoreActions.SetEditorValue, payload: { value: value } });
    };

    return (
        <div className="Editor">
            <AceEditor
                ref={editorRef}
                className="EditorInput"
                mode="yaml"
                theme="monokai"
                name="Editor"
                editorProps={{
                    $blockScrolling: true,
                }}
                onCursorChange={(selection: Ace.Selection) => {
                    setCurrentLine(selection.getRange().end.row);
                    setCurrentColumn(selection.getRange().end.column);
                    if (editorRef.current) {
                        setCurrentSelection(
                            selection.isEmpty()
                                ? undefined
                                : editorRef.current.editor.getSession().getTextRange(selection.getRange()).length || 0
                        );
                    }
                }}
                onChange={(value: string) => handleChange(value)}
                width="100%"
                fontSize={fontSize * 16}
                enableLiveAutocompletion={true}
                enableBasicAutocompletion={true}
            />
            <div className="EditorSettings">
                <select value={fontSize} onChange={(event) => setFontSize(parseFloat(event.target.value))}>
                    {fontSizes.map((size) => (
                        <option value={size}>{`${Math.floor(size * 100)} %`}</option>
                    ))}
                </select>
                <div className="EditorInfo">
                    {`Ln ${currentLine + 1}, Col ${currentColumn + 1} ${
                        currentSelection ? `(${currentSelection} selected)` : ""
                    }`}
                </div>
            </div>
        </div>
    );
};
