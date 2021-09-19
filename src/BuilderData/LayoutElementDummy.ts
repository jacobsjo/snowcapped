import { ElementRenderer } from "../UI/Renderer/ElementRenderer";
import { ABElement } from "./ABBiome";
import { Biome } from "./Biome";
import { BiomeBuilder } from "./BiomeBuilder";
import { LayoutElement, Mode } from "./LayoutElement";


export class LayoutElementDummy implements LayoutElement{
    allowDeletion: boolean = false
    name: string = "__dummy__";

    static create(builder: BiomeBuilder): LayoutElementDummy{
        const dummy = new LayoutElementDummy()
        builder.registerLayoutElement(dummy);
        return dummy
    }

    lookupKey(temperatureIndex: number, humidityIndex: number): string {
        return "__dummy__"
    }

    lookup(temperatureIndex: number, humidityIndex: number): LayoutElement {
        return this
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): LayoutElement {
        return this
    }

    getRenderer(): ElementRenderer {
        throw new Error("Method not implemented.");
    }
    getKey(): string {
        return "__dummy__"
    }

}