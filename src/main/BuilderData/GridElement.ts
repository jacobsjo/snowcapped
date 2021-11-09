import { GridElementRenderer } from "../UI/Renderer/ElementRenderer";
import { MultiNoiseIndexes, PartialMultiNoiseIndexes } from "./BiomeBuilder";

export type Mode = "A" | "B" | "Any"

export interface GridElement{
    name: string
    hidden: boolean
    type_id: number
    readonly allowEdit: boolean
    lookupKey(indexes: MultiNoiseIndexes, mode: Mode): string
    lookup(indexes: MultiNoiseIndexes, mode: Mode): GridElement
    lookupRecursive(indexes: PartialMultiNoiseIndexes, mode: Mode, stopAtHidden?: boolean): GridElement
    getRenderer(): GridElementRenderer
    getKey(): string
    has(key: string, limit: PartialMultiNoiseIndexes): boolean
}