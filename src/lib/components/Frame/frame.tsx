import React from "react";
import ReactDOM from "react-dom";

export const Frame: React.FC = (props) => {
    const frameRef = React.useRef<HTMLIFrameElement | null>(null);

    const renderFrameComponents = () => {
        if (!frameRef.current) {
            return;
        }
        const document = frameRef.current.contentDocument;
        if (
            document?.readyState === "complete" &&
            props.children &&
            frameRef.current.contentDocument &&
            frameRef.current.contentDocument.querySelector("#root")
        ) {
            console.log(frameRef.current.contentDocument.querySelector("#root"));
            ReactDOM.render(
                props.children as React.ReactElement<any, string | React.JSXElementConstructor<any>>[],
                frameRef.current.contentDocument.querySelector("#root")
            );
        } else {
            setTimeout(renderFrameComponents, 100);
        }
    };

    React.useEffect(() => {
        renderFrameComponents();
    }, [props.children]);

    React.useEffect(() => {
        renderFrameComponents();

        return () => {
            if (frameRef.current && frameRef.current.contentDocument) {
                ReactDOM.unmountComponentAtNode(
                    frameRef.current.contentDocument.querySelector("#root") as HTMLDivElement
                );
            }
        };
    }, []);
    return <iframe src="index.html" ref={frameRef} />;
};
