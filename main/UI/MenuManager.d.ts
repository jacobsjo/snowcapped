export declare class MenuManager {
    private static loadVanilla118Button;
    private static loadVanilla119Button;
    private static loadEmptyButton;
    private static openButton;
    private static saveButton;
    private static saveAsButton;
    private static exportZipButton;
    private static exportInsertButton;
    private static settingsButton;
    private static toggleDarkmodeButton;
    private static fileHandle;
    static fileName: string;
    static loadVanilla(filename: string): Promise<void>;
    static maybeLoadJson(json: any): void;
    static createClickHandlers(): void;
    private static confirmUnsavedChanges;
    static updateTitle(): void;
    static toggleAction(name: string, force?: boolean): void;
}
//# sourceMappingURL=MenuManager.d.ts.map