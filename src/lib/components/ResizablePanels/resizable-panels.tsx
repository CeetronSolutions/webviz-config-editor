import React from "react";

import "./resizable-panels.css";

type ResizablePanelsProps = {
    children: React.ReactNode[];
};

type Point = {
    x: number;
    y: number;
};

export const ResizablePanels: React.FC<ResizablePanelsProps> = (props) => {
    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);
    const [initialPosition, setInitialPosition] = React.useState<Point>({ x: 0, y: 0 });
    const [sizes, setSizes] = React.useState<number[]>([]);
    const resizablePanelRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    const resize = React.useCallback(
        (event: MouseEvent) => {
            const firstElement = resizablePanelRefs.current[currentIndex];
            const secondElement = resizablePanelRefs.current[currentIndex + 1];
            if (firstElement && secondElement) {
                const newSizes = sizes.map((size, index) => {
                    if (index === currentIndex) {
                        return event.clientX - firstElement.getBoundingClientRect().left;
                    } else if (index === currentIndex + 1) {
                        return (
                            secondElement.getBoundingClientRect().width +
                            (secondElement.getBoundingClientRect().left - event.clientX)
                        );
                    }
                });
            }
        },
        [isDragging]
    );

    const startResize = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
            console.log("start resize");
            window.addEventListener("selectstart", (e) => e.preventDefault());
            setIsDragging(true);
            console.log(isDragging);
            setCurrentIndex(index);
            setInitialPosition({ x: event.clientX, y: event.clientY });
        },
        [setCurrentIndex, setIsDragging, setInitialPosition]
    );

    const stopResize = (event: MouseEvent) => {
        window.removeEventListener("selectstart", (e) => e.preventDefault());
        setIsDragging(false);
        console.log("stop resize");
    };

    React.useEffect(() => {
        setSizes(props.children.map((_) => 100 / props.children.length));
        resizablePanelRefs.current = resizablePanelRefs.current.slice(0, props.children.length);
        console.log("changed");
    }, [props.children]);

    React.useEffect(() => {
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);

        return () => {
            document.removeEventListener("mousemove", resize);
            document.removeEventListener("mouseup", stopResize);
        };
    }, []);

    return (
        <div className="ResizablePanelsWrapper">
            {props.children.map((el: React.ReactNode, index: number) => (
                <>
                    <div
                        className="ResizablePanel"
                        ref={(el) => (resizablePanelRefs.current[index] = el)}
                        key={`resizable-panel-${index}`}
                        style={{ width: sizes[index] }}
                    >
                        {el}
                    </div>
                    {index < props.children.length - 1 && (
                        <div
                            className="ResizeDragBar"
                            key={`resizable-panel-drag-bar-${index}`}
                            onMouseDown={(e) => startResize(e, index)}
                        ></div>
                    )}
                </>
            ))}
        </div>
    );
};
