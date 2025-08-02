export {};

declare global {
    interface Window {
        electron?: {
            ipcRenderer: {
                on: (channel: string, callback: (...args: any[]) => void) => void;
            };
        };
    }
}
