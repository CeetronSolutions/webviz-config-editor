import React from "react";

type TabMenuProps = {
    onChange: (newValue: number) => void;
    children?: JSX.Element[];
};

export const TabMenu: React.FC<TabMenuProps> = (props) => {
    return (
        <div className="TabMenu">
            {props.children &&
                props.children.map((tab) => {
                    React.cloneElement(tab, {});
                })}
        </div>
    );
};
