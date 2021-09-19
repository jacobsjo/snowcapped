import { ABBiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { Biome } from './Biome'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class ABElement implements LayoutElement{
    readonly allowDeletion: boolean = false
    readonly elementA: LayoutElement
    readonly elementB: LayoutElement

    private renderer: ABBiomeRenderer
    readonly name: string

    private constructor(elementA: Biome, elementB: Biome){
        this.elementA = elementA
        this.elementB = elementB
    }

    static create(builder: BiomeBuilder, elementA: Biome, elementB: Biome): ABElement{
        const ab_biome = new ABElement(elementA, elementB)
        builder.registerLayoutElement(ab_biome);
        return ab_biome
    }

    lookupKey(temperatureIndex: number, humidityIndex: number): string{
        return this.getKey()
    }

    lookup(temperatureIndex: number, humidityIndex: number): ABElement {
        return this
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode): LayoutElement {
        if (mode === "Any"){
            return this
        } else if (mode === "A"){
            return this.elementA.lookupRecursive(temperatureIndex, humidityIndex, mode)
        } else {
            return this.elementB.lookupRecursive(temperatureIndex, humidityIndex, mode)
        }
    }


    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new ABBiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.elementA.getKey() + "/" + this.elementB.getKey()
    }
}