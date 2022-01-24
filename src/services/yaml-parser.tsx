import React from "react";

import {createGenericContext} from "@utils/generic-context";

import {useAppDispatch} from "@redux/hooks";
import {
    setFileObjects,
    setFileObjectsAndSelection,
    setSelectedObject,
} from "@redux/reducers/files";

import {
    YamlParserWorkerRequestType,
    YamlParserWorkerResponseType,
} from "@shared-types/yaml-parser-worker";

import {Selection} from "monaco-editor";
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import YamlParserWorker from "worker-loader!@workers/parser.worker";

type Context = {
    parse: (value: string) => void;
    parseAndSetSelection: (value: string, selection: Selection) => void;
    updateSelection: (selection: Selection) => void;
    setCurrentPage: (pageId: string) => void;
};

const [useYamlParserServiceContext, YamlParserServiceContextProvider] =
    createGenericContext<Context>();

export const YamlParserService: React.FC = props => {
    const yamlParser = React.useRef<YamlParserWorker>(new YamlParserWorker());
    const dispatch = useAppDispatch();

    const parse = React.useCallback((value: string) => {
        if (yamlParser.current) {
            yamlParser.current.postMessage({
                type: YamlParserWorkerRequestType.Parse,
                text: value,
            });
        }
    }, []);

    const parseAndSetSelection = React.useCallback(
        (value: string, selection: Selection) => {
            if (yamlParser.current) {
                yamlParser.current.postMessage({
                    type: YamlParserWorkerRequestType.ParseAndSetSelection,
                    text: value,
                    startLineNumber: Math.min(
                        selection.selectionStartLineNumber,
                        selection.positionLineNumber
                    ),
                    endLineNumber: Math.max(
                        selection.selectionStartLineNumber,
                        selection.positionLineNumber
                    ),
                });
            }
        },
        []
    );

    const updateSelection = React.useCallback((selection: Selection) => {
        if (yamlParser.current) {
            yamlParser.current.postMessage({
                type: YamlParserWorkerRequestType.GetClosestObject,
                startLineNumber: Math.min(
                    selection.selectionStartLineNumber,
                    selection.positionLineNumber
                ),
                endLineNumber: Math.max(
                    selection.selectionStartLineNumber,
                    selection.positionLineNumber
                ),
            });
        }
    }, []);

    const setCurrentPage = React.useCallback((pageId: string) => {
        if (yamlParser.current) {
            yamlParser.current.postMessage({
                type: YamlParserWorkerRequestType.GetObjectById,
                id: pageId,
            });
        }
    }, []);

    React.useEffect(() => {
        if (yamlParser.current) {
            yamlParser.current.onmessage = (e: MessageEvent) => {
                const data = e.data;
                switch (data.type) {
                    case YamlParserWorkerResponseType.Parsed:
                        dispatch(
                            setFileObjects({
                                yamlObjects: data.objects,
                                title: data.title,
                                navigationItems: data.navigationItems,
                            })
                        );
                        break;
                    case YamlParserWorkerResponseType.ParsedAndSetSelection:
                        dispatch(
                            setFileObjectsAndSelection({
                                yamlObjects: data.objects,
                                selectedObject: data.selectedObject,
                                pageId: data.page?.id || "",
                            })
                        );
                        break;
                    case YamlParserWorkerResponseType.ClosestObject:
                        dispatch(
                            setSelectedObject({
                                object: data.object,
                                pageId: data.page?.id || "",
                            })
                        );
                        break;
                    case YamlParserWorkerResponseType.ObjectById:
                        dispatch(
                            setSelectedObject({
                                object: data.object,
                                pageId: data.object?.id || "",
                            })
                        );
                        break;
                    default:
                }
            };
        }
        const yamlParserRef = yamlParser.current;
        return () => {
            if (yamlParserRef) {
                yamlParserRef.terminate();
            }
        };
    }, [dispatch]);

    return (
        <YamlParserServiceContextProvider
            value={{
                parse,
                parseAndSetSelection,
                updateSelection,
                setCurrentPage,
            }}
        >
            {props.children}
        </YamlParserServiceContextProvider>
    );
};

export const useYamlParser = (): Context => useYamlParserServiceContext();
