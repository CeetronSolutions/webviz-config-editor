import { uuid } from "uuidv4";
import yaml from "yaml";

export enum YamlObjectType {
    Title = "TITLE",
    Section = "SECTION",
    Group = "GROUP",
    Page = "PAGE",
    Plugin = "PLUGIN",
}

export type YamlObject = {
    type: YamlObjectType;
    id: string;
    key: string;
    value: any;
    startLineNumber: number;
    endLineNumber: number;
    children: YamlObject[];
};

export class YamlParser {
    private objects: YamlObject[];
    constructor() {
        this.objects = [];
    }

    getLineNumber(value: string, offset: number): number {
        return value.substr(0, offset).split("\n").length;
    }

    getTotalNumLines(value: string): number {
        return value.split("\n").length;
    }

    getEndLineNumber(value: string, item: yaml.CST.Token): number {
        let object: yaml.CST.Token = item;
        while (true) {
            if (object.type !== "block-seq" && object.type !== "block-map") {
                break;
            }
            if (object.items.length > 0) {
                if (object.items[object.items.length - 1].value) {
                    object = object.items[object.items.length - 1].value as yaml.CST.Token;
                } else {
                    object = object.items[object.items.length - 1].start[0];
                }
                continue;
            }
            break;
        }
        return this.getLineNumber(value, object.offset);
    }

    parse(value: string): void {
        const tokens = new yaml.Parser().parse(value);
        this.objects = [];
        for (const token of tokens) {
            console.log(token);
            if (token.type === "document") {
                if (token.value && token.value.type === "block-map") {
                    token.value.items.forEach((item) => {
                        if (item.key) {
                            if (item.key.type === "scalar" && item.key.source === "title") {
                                this.objects.push({
                                    type: YamlObjectType.Title,
                                    id: uuid(),
                                    key: item.key.source,
                                    value: item.value,
                                    startLineNumber: this.getLineNumber(value, item.key.offset),
                                    endLineNumber: this.getLineNumber(value, item.key.offset),
                                    children: [],
                                });
                            } else if (
                                item.key.type === "scalar" &&
                                item.key.source === "layout" &&
                                item.value &&
                                item.value.type === "block-seq"
                            ) {
                                this.objects.push(...this.parseLayoutObject(value, item.value));
                            }
                        }
                    });
                }
            }
        }
    }

    private parseLayoutObject(value: string, object: yaml.CST.BlockSequence): YamlObject[] {
        const objects: YamlObject[] = [];
        const typesMap: { [key: string]: YamlObjectType } = {
            page: YamlObjectType.Page,
            section: YamlObjectType.Section,
            group: YamlObjectType.Group,
        };
        object.items.forEach((item) => {
            if (item.value) {
                const startLineNumber = this.getLineNumber(value, item.start[1].offset);
                const endLineNumber = this.getEndLineNumber(value, item.value);
                const currentItem = item.value;
                if (
                    currentItem.type === "block-map" &&
                    currentItem.items[0].key &&
                    currentItem.items[0].key.type === "scalar"
                ) {
                    const children = currentItem.items.find(
                        (el) => el.key && el.key.type === "scalar" && el.key.source === "content"
                    );
                    const type = typesMap[currentItem.items[0].key.source] || YamlObjectType.Plugin;
                    objects.push({
                        type: type,
                        id: uuid(),
                        key: currentItem.items[0].key.source,
                        value: currentItem.items[0].value,
                        startLineNumber: startLineNumber,
                        endLineNumber: endLineNumber,
                        children:
                            children && children.value?.type === "block-seq"
                                ? this.parseLayoutObject(value, children.value)
                                : [],
                    });
                }
            }
        });
        return objects;
    }

    getObjects(): YamlObject[] {
        return this.objects;
    }

    static findClosestChild(
        yamlObjects: YamlObject[],
        startLineNumber: number,
        endLineNumber: number
    ): YamlObject | undefined {
        let objects = yamlObjects;
        let lastMatchingObject: YamlObject | undefined;
        let breakLoop = false;
        while (true) {
            let numMatches = 0;
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i];
                if (object.startLineNumber <= startLineNumber && object.endLineNumber >= endLineNumber) {
                    numMatches++;
                    lastMatchingObject = object;
                    if (object.children.length === 0) {
                        breakLoop = true;
                    } else {
                        objects = object.children;
                    }
                    break;
                }
            }
            if (breakLoop || !lastMatchingObject || numMatches === 0) {
                break;
            }
        }
        return lastMatchingObject;
    }
}
