import {useEffect, useState} from "react";

import {preprocessJsonSchema} from "@utils/json-schema-preprocessor";

import {NotificationType} from "@components/Notifications";

import {useAppDispatch, useAppSelector} from "@redux/hooks";
import {addNotification} from "@redux/reducers/notifications";

import {setDiagnosticsOptions} from "monaco-yaml";

export const useYamlSchema = (yaml: any) => {
    const [loaded, setLoaded] = useState<boolean>(false);
    const pathToYamlSchemaFile = useAppSelector(
        state => state.preferences.pathToYamlSchemaFile
    );
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (yaml && pathToYamlSchemaFile && pathToYamlSchemaFile !== "") {
            let jsonSchema: object;
            try {
                jsonSchema = preprocessJsonSchema(pathToYamlSchemaFile);
            } catch (e) {
                dispatch(
                    addNotification({
                        type: NotificationType.ERROR,
                        message: "Invalid Webviz YAML schema selected.",
                        action: {
                            label: "Change",
                            action: () => {},
                        },
                    })
                );
                return;
            }

            setDiagnosticsOptions({
                validate: true,
                enableSchemaRequest: true,
                hover: true,
                completion: true,
                format: true,
                schemas: [
                    {
                        fileMatch: ["*"],
                        uri: `file://${pathToYamlSchemaFile}`, // id of the first schema
                        schema: jsonSchema || {},
                    },
                ],
            });
            setLoaded(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathToYamlSchemaFile]);

    return loaded;
};
