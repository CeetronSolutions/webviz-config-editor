import {changeFilePath, markAsSaved} from "@redux/reducers/files";
import {addNotification} from "@redux/reducers/notifications";
import {AppDispatch} from "@redux/store";

import {Notification, NotificationType} from "@shared-types/notifications";

import fs from "fs";

export function saveFile(
    filePath: string,
    value: string,
    dispatch: AppDispatch
) {
    try {
        fs.writeFileSync(filePath, value, {
            encoding: "utf-8",
            flag: "w",
        });
        dispatch(markAsSaved(filePath));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not save file '${filePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}

export function saveFileAs(
    oldFilePath: string,
    newFilePath: string,
    value: string,
    dispatch: AppDispatch
) {
    try {
        fs.writeFileSync(newFilePath, value, {
            encoding: "utf-8",
            flag: "w",
        });
        dispatch(changeFilePath({oldFilePath, newFilePath}));
    } catch (e) {
        const notification: Notification = {
            type: NotificationType.ERROR,
            message: `Could not save file '${newFilePath}'. ${e}`,
        };
        dispatch(addNotification(notification));
    }
}
