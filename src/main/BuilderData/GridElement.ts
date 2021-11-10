import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { Biome } from "./Biome";
import { MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { Grid } from "./Grid";

export type Mode = "A" | "B" | "Any"

export interface GridElement{
    name: string
    hidden: boolean
    readonly allowEdit: boolean
    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string
    lookup(indexes: MultiNoiseIndexes, mode: Mode): GridElement
    lookupRecursive(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): GridElement
    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Grid, layout: Grid, biome: Biome}
    getRenderer(): GridElementRenderer
    getKey(): string
    has(key: string, limit: PartialMultiNoiseIndexes): boolean
}