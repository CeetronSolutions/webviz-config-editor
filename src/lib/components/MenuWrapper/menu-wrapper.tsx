import React from "react";
import { Menu } from "@webviz/core-components";
import { MenuProps } from "@webviz/core-components/dist/components/Menu/Menu";

import "./menu-wrapper.css";

export const MenuWrapper: React.FC<MenuProps> = (props) => {
    const menuWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = React.useState<boolean>(false);
    const [width, setWidth] = React.useState<number>(0);

    const [resizeOberserver, setResizeObserver] = React.useState<ResizeObserver | undefined>();

    const updateWidth = React.useCallback(
        (entries) => {
            for (const entry of entries) {
                if (entry.contentRect) {
                    setWidth(entry.contentRect.width);
                }
            }
        },
        [setWidth]
    );

    React.useEffect(() => {
        setResizeObserver(new ResizeObserver(updateWidth));
        return () => {
            if (resizeOberserver) {
                resizeOberserver.disconnect();
            }
        };
    }, []);

    React.useEffect(() => {
        if (!resizeOberserver) {
            return;
        }
        if (menuWrapperRef.current) {
            const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                | HTMLElement
                | undefined;
            if (menu) {
                resizeOberserver.observe(menu, { box: "border-box" });
            }
        }
        return () => {
            if (menuWrapperRef.current) {
                resizeOberserver.unobserve(menuWrapperRef.current);
            }
        };
    }, [menuWrapperRef, resizeOberserver]);

    React.useEffect(() => {
        window.setTimeout(() => {
            if (menuWrapperRef.current) {
                const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                    | HTMLElement
                    | undefined;
                if (menu) {
                    setWidth(menu.getBoundingClientRect().width);
                    const bodyMargins = { left: 0, top: 0, right: 0, bottom: 0 };
                    menu.style.position = "absolute";
                    menu.style.height = menuWrapperRef.current.getBoundingClientRect().height + "px";
                    document.body.style.marginLeft = bodyMargins.left + "px";
                    document.body.style.marginTop = bodyMargins.top + "px";
                    document.body.style.marginRight = bodyMargins.right + "px";
                    document.body.style.marginBottom = bodyMargins.bottom + "px";
                    setVisible(true);
                }
                const pinButton = menuWrapperRef.current.getElementsByClassName("Menu__TopMenu")[0] as
                    | HTMLElement
                    | undefined;
                if (pinButton) {
                    pinButton.style.display = "none";
                }
            }
        }, 0);
    }, [menuWrapperRef]);

    return (
        <div
            ref={menuWrapperRef}
            className="MenuWrapper"
            style={{ width: width, visibility: visible ? "visible" : "hidden" }}
        >
            <Menu initiallyPinned={true} showFilterInput={false} {...props} />
        </div>
    );
};
