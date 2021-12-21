import { parentPort } from "worker_threads";

import { YamlParser } from "./yaml-parser";
import {
    YamlParserWorkerRequestType,
    YamlParserWorkerResponseType,
    YamlParserWorkerRequestData,
    YamlParserWorkerResponseData,
} from "../types/yaml-parser-worker";

const yamlParser = new YamlParser();

if (parentPort) {
    parentPort.on("message", (data: YamlParserWorkerRequestData) => {
        if (parentPort) {
            switch (data.type) {
                case YamlParserWorkerRequestType.Parse:
                    yamlParser.parse(data.text);
                    parentPort.postMessage({
                        type: YamlParserWorkerResponseType.Parsed,
                        objects: yamlParser.getObjects(),
                        title: yamlParser.getTitle(),
                        navigationItems: yamlParser.getNavigationItems(),
                    });
                    break;
                case YamlParserWorkerRequestType.GetClosestObject:
                    parentPort.postMessage({
                        type: YamlParserWorkerResponseType.ClosestObject,
                        object: yamlParser.findClosestObject(data.startLineNumber, data.endLineNumber),
                        page: yamlParser.findClosestPage(data.startLineNumber, data.endLineNumber),
                    });
                    break;
                case YamlParserWorkerRequestType.GetObjectById:
                    parentPort.postMessage({
                        type: YamlParserWorkerResponseType.ObjectById,
                        object: yamlParser.getObjectById(data.id),
                    });
                    break;
            }
        }
    });
}
