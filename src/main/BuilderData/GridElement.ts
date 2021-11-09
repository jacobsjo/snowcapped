import { Layer } from "leaflet";
import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { Biome } from "./Biome";
import { MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";
import { GridElementUnassigned } from "./GridElementUnassigned";
import { Layout } from "./Layout";
import { Slice } from "./Slice";

export type Mode = "A" | "B" | "Any"

export interface GridElement{
    name: string
    hidden: boolean
    type_id: number
    readonly allowEdit: boolean
    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string
    lookup(indexes: MultiNoiseIndexes, mode: Mode): GridElement
    lookupRecursive(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): GridElement
    lookupRecursiveWithTracking(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): {slice: Slice, layout: Layout, biome: Biome}
    getRenderer(): GridElementRenderer
    getKey(): string
    has(key: string, limit: PartialMultiNoiseIndexes): boolean
}