/// <reference types="wicg-file-system-access" />
import * as JSZip from "jszip";
import { BiomeBuilder } from "./BiomeBuilder";
export declare class Exporter {
    private builder;
    constructor(builder: BiomeBuilder);
    private findIdx;
    generateZip(): Promise<JSZip>;
    insertIntoDirectory(dirHandle: FileSystemDirectoryHandle): Promise<void>;
    getDimensionJSON(): string;
    private checkRange;
    private setDone;
    getNoiseSettingJSON(old_json?: string): Promise<string>;
    private findClosingBracket;
}
//# sourceMappingURL=Exporter.d.ts.map