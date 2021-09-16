import { ABBiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { Biome } from './Biome'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class ABElement implements LayoutElement{
    readonly name: string

    readonly elementA: LayoutElement
    readonly elementB: LayoutElement

    private renderer: ABBiomeRenderer

    private constructor(elementA: Biome, elementB: Biome){
        this.elementA = elementA
        this.elementB = elementB
        this.name = elementA.name + " / " + elementB.name
    }

    static create(builder: BiomeBuilder, elementA: Biome, elementB: Biome): ABElement{
        const ab_biome = new ABElement(elementA, elementB)
        builder.registerLayoutElement(ab_biome);
        return ab_biome
    }

    getKey(temperatureIndex: number, humidityIndex: number): string{
        return this.name
    }

    get(temperatureIndex: number, humidityIndex: number): ABElement {
        return this
    }

    getRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): ABElement | Biome {
        if (mode === "Any"){
            return this
        } else if (mode === "A"){
            return this.elementA.getRecursive(temperatureIndex, humidityIndex, mode)
        } else {
            return this.elementB.getRecursive(temperatureIndex, humidityIndex, mode)
        }
    }


    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new ABBiomeRenderer(this)

        return this.renderer
    }
}