export type Config = {
    id: string;
    config: unknown;
};

export type ResizablePanelsConfig = Config & {
    config: number[];
};
