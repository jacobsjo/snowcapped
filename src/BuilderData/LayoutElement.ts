import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";

export type Mode = "A" | "B" | "Any"

export interface LayoutElement{
    getKey(temperatureIndex: number, humidityIndex: number): string
    get(temperatureIndex: number, humidityIndex: number): LayoutElement
    getRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): ABElement | Biome
    readonly name: string;
    getRenderer(): ElementRenderer
}