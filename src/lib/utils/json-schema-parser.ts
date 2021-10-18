import { makeRequest, RequestMethod } from "./api";

export class JsonSchemaParser {
    protected pathToJsonSchema: string;
    protected jsonSchema: { [key: string]: string };
    public isValid: boolean;
    public errors?: string[];
    constructor(pathToJsonSchema?: string) {
        this.jsonSchema = {};
        this.isValid = false;
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
                } else {
                    this.jsonSchema = {};
                }
            },
            RequestMethod.POST,
            { pythonInterpreter: pythonInterpreter }
        );
    }

    validate(yamlCode: string): void {}
}
