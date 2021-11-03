import React from "react";
import { Menu } from "@webviz/core-components";
import { MenuProps } from "@webviz/core-components/dist/components/Menu/Menu";

import "./menu-wrapper.css";
import useSize from "@react-hook/size";

export const MenuWrapper: React.FC<MenuProps> = (props) => {
    const menuWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = React.useState<boolean>(false);
    const [width, setWidth] = React.useState<number>(0);

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
                const filterWrapper = menuWrapperRef.current.getElementsByClassName("Menu__FilterInputWrapper")[0] as
                    | HTMLElement
                    | undefined;
                if (filterWrapper) {
                    filterWrapper.style.display = "none";
                }
            }
        }, 100);
    }, [menuWrapperRef]);

    return (
        <div
            ref={menuWrapperRef}
            className="MenuWrapper"
            style={{ width: width, visibility: visible ? "visible" : "hidden" }}
        >
            <Menu initiallyPinned={true} {...props} />
        </div>
    );
};
