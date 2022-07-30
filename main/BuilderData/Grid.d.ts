import { Biome } from "./Biome";
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElement, Mode } from "./GridElement";
import { BiomeGridRenderer } from "../UI/Renderer/BiomeGridRenderer";
export interface MultiNoiseIndexesAccessor {
    readonly type: "dimension" | "layout" | "slice";
    getSize(bulder: BiomeBuilder): [number, number];
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes;
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all";
    paramToAxis(param: string): "x" | "y";
    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged";
}
export declare class DimensionMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor {
    builder: BiomeBuilder;
    constructor(builder: BiomeBuilder);
    type: "dimension";
    getSize(bulder: BiomeBuilder): [number, number];
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes;
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all";
    paramToAxis(param: string): "x" | "y";
    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged";
}
export declare class SliceMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor {
    type: "layout" | "slice";
    getSize(bulder: BiomeBuilder): [number, number];
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes;
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all";
    paramToAxis(param: string): "x" | "y";
    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged";
}
export declare class LayoutMultiNoiseIndexesAccessor implements MultiNoiseIndexesAccessor {
    type: "layout" | "slice";
    getSize(bulder: BiomeBuilder): [number, number];
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes;
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all";
    paramToAxis(param: string): "x" | "y";
    modesetting(indexes: PartialMultiNoiseIndexes): "A" | "B" | "unchanged";
}
export declare class Grid implements GridElement {
    allowEdit: boolean;
    name: string;
    hidden: boolean;
    private accessor;
    private array;
    private lookup_cache;
    private builder;
    private renderer;
    private key;
    private undoActions;
    private constructor();
    static create(builder: BiomeBuilder, name: string, accessor: MultiNoiseIndexesAccessor, array?: string[][], key?: string): Grid;
    static fromJSON(builder: BiomeBuilder, json: any, accessor: MultiNoiseIndexesAccessor): Grid;
    toJSON(): {
        key: string;
        name: string;
        array: string[][];
    };
    getSize(): [number, number];
    getType(): "dimension" | "layout" | "slice";
    set(indexes: PartialMultiNoiseIndexes, element: string, recordUndo?: boolean): void;
    undo(): void;
    deleteParam(param: string, id: number): void;
    splitParam(param: string, id: number): void;
    deleteGridElement(key: string): void;
    lookupKey(indexes: PartialMultiNoiseIndexes, _mode: Mode): string;
    lookup(indexes: PartialMultiNoiseIndexes, mode: Mode): GridElement;
    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): GridElement;
    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {
        mode: Mode;
        slice: Grid;
        layout: Grid;
        biome: Biome;
    };
    getRenderer(): BiomeGridRenderer;
    cellToIds(x: number, y: number): PartialMultiNoiseIndexes;
    idsToCell(indexes: PartialMultiNoiseIndexes): [number, number] | "all";
    getKey(): string;
    has(key: string, limit: PartialMultiNoiseIndexes): boolean;
}
//# sourceMappingURL=Grid.d.ts.map