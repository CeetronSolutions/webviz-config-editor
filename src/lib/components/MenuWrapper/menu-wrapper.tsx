import React from "react";
import { Menu } from "@webviz/core-components";
import { MenuProps } from "@webviz/core-components/dist/components/Menu/Menu";

import "./menu-wrapper.css";
import useSize from "@react-hook/size";

export const MenuWrapper: React.FC<MenuProps> = (props) => {
    const menuWrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [width, height] = useSize(menuWrapperRef);

    React.useEffect(() => {
        window.setTimeout(() => {
            if (menuWrapperRef.current) {
                const menu = menuWrapperRef.current.getElementsByClassName("Menu__MenuDrawer")[0] as
                    | HTMLElement
                    | undefined;
                if (menu) {
                    const bodyMargins = { left: 0, top: 0, right: 0, bottom: 0 };
                    menu.style.position = "absolute";
                    document.body.style.marginLeft = bodyMargins.left + "px";
                    document.body.style.marginTop = bodyMargins.top + "px";
                    document.body.style.marginRight = bodyMargins.right + "px";
                    document.body.style.marginBottom = bodyMargins.bottom + "px";
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
        }, 10);
    }, [menuWrapperRef.current]);

    return (
        <div ref={menuWrapperRef} className="MenuWrapper">
            <Menu initiallyPinned={true} {...props} />
            <div className="MenuWrapper__Overlay" style={{ width: width, height: "100vh" }} />
        </div>
    );
};
