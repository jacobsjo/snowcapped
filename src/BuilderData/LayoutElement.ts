import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";

export type Mode = "A" | "B" | "Any"

export interface LayoutElement{
    readonly name: string
    lookupKey(temperatureIndex: number, humidityIndex: number): string
    lookup(temperatureIndex: number, humidityIndex: number): LayoutElement
    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): LayoutElement
    getRenderer(): ElementRenderer
    getKey(): string
}