import { RecordedEvent } from "./recordedEvent";

export interface API {
    send: (channel: string, ...args: unknown[]) => void;
    sendSync: (channel: string, ...args: unknown[]) => unknown;
    on: {
        // (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void;
        (channel: string, listener: (event: RecordedEvent) => void): void;
        (channel: string, listener: (recording: boolean) => void): void;
    };
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}