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

    parse(value: string): void {
        const tokens = new yaml.Parser().parse(value);
        for (const token of tokens) {
            if (token.type === "document") {
                if (token.value && token.value.type === "block-map") {
                    token.value.items.forEach((item) => {
                        if (item.key) {
                            if (item.key.type === "scalar" && item.key.source === "title") {
                                this.objects.push({
                                    type: YamlObjectType.Title,
                                    id: uuid(),
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
        console.log(this.objects);
    }

    private parseLayoutObject(value: string, object: yaml.CST.BlockSequence): YamlObject[] {
        const objects: YamlObject[] = [];
        object.items.forEach((item) => {
            if (item.value) {
                const startLineNumber = this.getLineNumber(value, item.start[1].offset);
                const endLineNumber = startLineNumber;
                const currentItem = item.value;
                if (
                    currentItem.type === "block-map" &&
                    currentItem.items[0].key &&
                    currentItem.items[0].key.type === "scalar"
                ) {
                    if (currentItem.items[0].key.source === "page") {
                        const children = currentItem.items.find(
                            (el) => el.key && el.key.type === "scalar" && el.key.source === "content"
                        );
                        objects.push({
                            type: YamlObjectType.Page,
                            id: uuid(),
                            startLineNumber: startLineNumber,
                            endLineNumber: endLineNumber,
                            children:
                                children && children.value?.type === "block-seq"
                                    ? this.parseLayoutObject(value, children.value)
                                    : [],
                        });
                    } else if (currentItem.items[0].key.source === "section") {
                        const children = currentItem.items.find(
                            (el) => el.key && el.key.type === "scalar" && el.key.source === "content"
                        );
                        objects.push({
                            type: YamlObjectType.Section,
                            id: uuid(),
                            startLineNumber: startLineNumber,
                            endLineNumber: endLineNumber,
                            children:
                                children && children.value?.type === "block-seq"
                                    ? this.parseLayoutObject(value, children.value)
                                    : [],
                        });
                    } else if (currentItem.items[0].key.source === "group") {
                        const children = currentItem.items.find(
                            (el) => el.key && el.key.type === "scalar" && el.key.source === "content"
                        );
                        objects.push({
                            type: YamlObjectType.Page,
                            id: uuid(),
                            startLineNumber: startLineNumber,
                            endLineNumber: endLineNumber,
                            children:
                                children && children.value?.type === "block-seq"
                                    ? this.parseLayoutObject(value, children.value)
                                    : [],
                        });
                    } else {
                        const children = currentItem.items.find(
                            (el) => el.key && el.key.type === "scalar" && el.key.source === "content"
                        );
                        objects.push({
                            type: YamlObjectType.Plugin,
                            id: uuid(),
                            startLineNumber: startLineNumber,
                            endLineNumber: endLineNumber,
                            children:
                                children && children.value?.type === "block-seq"
                                    ? this.parseLayoutObject(value, children.value)
                                    : [],
                        });
                    }
                }
            }
        });
        return objects;
    }

    getObjects(): YamlObject[] {
        return this.objects;
    }
}
