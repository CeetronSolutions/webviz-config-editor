import Ajv, {JSONSchemaType} from "ajv";
import * as yaml from "js-yaml";

import { makeRequest, RequestMethod } from "./api";

export class JsonSchemaParser {
    protected pathToJsonSchema: string;
    protected jsonSchema: { [key: string]: string };
    protected ajv: Ajv;
    protected validateFunction?: AjvTypes.ValidateFunction;
    protected parser: AjvTypes.
    public errors?: string[];
    constructor(pathToJsonSchema?: string) {
        this.jsonSchema = {};
        this.ajv = new Ajv();
        if (pathToJsonSchema) {
            this.pathToJsonSchema = pathToJsonSchema;
        } else {
            this.pathToJsonSchema = "";
        }
    }

    generateJsonSchema(pythonInterpreter: string): void {
        makeRequest(
            "/generate-json-schema",
            (data, error) => {
                if (error) {
                    return;
                }
                if (data["result"] === "success") {
                    this.jsonSchema = JSON.parse(data["schema"]);
                    this.parser = this.ajv.compileParser();
                    this.validateFunction = this.ajv.compile(this.jsonSchema);
                } else {
                    this.jsonSchema = {};
                }
            },
            RequestMethod.POST,
            { pythonInterpreter: pythonInterpreter }
        );
    }

    validate(yamlCode: string): void {
        if (this.validateFunction) {
            const json = yaml.load(yamlCode);
            const valid = this.validateFunction(json);
        }
    }
}
