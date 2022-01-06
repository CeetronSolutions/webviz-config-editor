import { YamlParser } from "../utils/yaml-parser";
import { YamlParserWorkerRequestType, YamlParserWorkerResponseType } from "../types/yaml-parser-worker";

const yamlParser = new YamlParser();

//eslint-disable-next-line
addEventListener("message", (event) => {
    switch (event.data.type) {
        case YamlParserWorkerRequestType.Parse:
            yamlParser.parse(event.data.text);
            postMessage({
                type: YamlParserWorkerResponseType.Parsed,
                objects: yamlParser.getObjects(),
                title: yamlParser.getTitle(),
                navigationItems: yamlParser.getNavigationItems(),
            });
            break;
        case YamlParserWorkerRequestType.GetClosestObject:
            postMessage({
                type: YamlParserWorkerResponseType.ClosestObject,
                object: yamlParser.findClosestObject(event.data.startLineNumber, event.data.endLineNumber),
                page: yamlParser.findClosestPage(event.data.startLineNumber, event.data.endLineNumber),
            });
            break;
        case YamlParserWorkerRequestType.GetObjectById:
            postMessage({
                type: YamlParserWorkerResponseType.ObjectById,
                object: yamlParser.getObjectById(event.data.id),
            });
            break;
        default:
            return;
    }
});
