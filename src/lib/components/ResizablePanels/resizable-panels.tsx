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
    const [isDragging, setIsDragging] = React.useState<boolean>();
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);
    const [initialPosition, setInitialPosition] = React.useState<Point>({ x: 0, y: 0 });
    const [sizes, setSizes] = React.useState<number[]>([]);
    const resizablePanelsRef = React.useRef<HTMLDivElement | null>(null);
    const resizablePanelRefs = React.useRef<(HTMLDivElement | null)[]>([]);

    React.useEffect(() => {
        setSizes(props.children.map((_) => 100 / props.children.length));
        resizablePanelRefs.current = resizablePanelRefs.current.slice(0, props.children.length);
    }, [props.children]);

    const startResize = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
            window.addEventListener("selectstart", (e) => e.preventDefault());
            setCurrentIndex(index);
            setInitialPosition({ x: event.clientX, y: event.clientY });
            setIsDragging(true);
        },
        [setCurrentIndex, setIsDragging, setInitialPosition]
    );

    React.useEffect(() => {
        const resize = (event: MouseEvent) => {
            if (!isDragging) {
                return;
            }
            const totalSize = resizablePanelsRef.current?.getBoundingClientRect().width || 0;
            const firstElement = resizablePanelRefs.current[currentIndex];
            const secondElement = resizablePanelRefs.current[currentIndex + 1];
            if (firstElement && secondElement) {
                const newSizes = sizes.map((size, index) => {
                    if (index === currentIndex) {
                        const newSize = event.clientX - firstElement.getBoundingClientRect().left;
                        return (newSize / totalSize) * 100;
                    } else if (index === currentIndex + 1) {
                        const newSize = secondElement.getBoundingClientRect().right - event.clientX;
                        return (newSize / totalSize) * 100;
                    } else {
                        return size;
                    }
                }) as number[];
                setSizes(newSizes);
            }
        };

        const stopResize = (event: MouseEvent) => {
            window.removeEventListener("selectstart", (e) => e.preventDefault());
            setIsDragging(false);
        };
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);

        return () => {
            document.removeEventListener("mousemove", resize);
            document.removeEventListener("mouseup", stopResize);
        };
    }, [isDragging, setIsDragging, sizes, setSizes]);

    return (
        <div className="ResizablePanelsWrapper" ref={resizablePanelsRef}>
            {props.children.map((el: React.ReactNode, index: number) => (
                <>
                    <div
                        className="ResizablePanel"
                        ref={(el) => (resizablePanelRefs.current[index] = el)}
                        key={`resizable-panel-${index}`}
                        style={{ width: sizes[index] + "%" }}
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
