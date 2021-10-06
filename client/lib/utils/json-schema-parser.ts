export class JsonSchemaParser {
    protected pathToJsonSchema: string;
    protected jsonSchema: string;
    constructor(pathToJsonSchema?: string) {
        this.jsonSchema = "";
        if (pathToJsonSchema) {
            this.pathToJsonSchema = pathToJsonSchema;
        } else {
            this.pathToJsonSchema = "";
        }
    }

    loadJsonSchema(pathToJsonSchema?: string): void {
        if (pathToJsonSchema) {
            this.pathToJsonSchema = pathToJsonSchema;
        }
    }
}
