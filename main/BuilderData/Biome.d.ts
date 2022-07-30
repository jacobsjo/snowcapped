import { GridElementRenderer } from '../UI/Renderer/ElementRenderer';
import { BiomeBuilder, MultiNoiseIndexes, PartialMultiNoiseIndexes } from './BiomeBuilder';
import { Grid } from './Grid';
import { GridElement, Mode } from './GridElement';
export declare class Biome implements GridElement {
    name: string;
    hidden: boolean;
    type_id: number;
    readonly allowEdit: boolean;
    color: string;
    private renderer;
    private isVanilla;
    raw_color: {
        r: number;
        g: number;
        b: number;
    };
    private key;
    private constructor();
    static create(builder: BiomeBuilder, name: string, color: string, key?: string, isVanilla?: boolean): Biome;
    setColor(color: string): void;
    private _hexToRgb;
    static fromJSON(builder: BiomeBuilder, json: any): Biome;
    toJSON(): {
        key: string;
        name: string;
        color: string;
    };
    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string;
    lookup(indexes: MultiNoiseIndexes, mode: Mode): Biome;
    lookupRecursive(indexes: MultiNoiseIndexes, mode: Mode): Biome;
    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {
        slice: Grid;
        layout: Grid;
        biome: Biome;
    };
    getRenderer(): GridElementRenderer;
    getKey(): string;
    has(key: string, _limit: PartialMultiNoiseIndexes): boolean;
}
//# sourceMappingURL=Biome.d.ts.map