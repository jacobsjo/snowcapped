import { ABBiomeRenderer, ElementRenderer } from '../UI/Renderer/ElementRenderer'
import { Biome } from './Biome'
import { BiomeBuilder } from './BiomeBuilder'
import {LayoutElement, Mode} from './LayoutElement'

export class ABElement implements LayoutElement{
    readonly allowEdit: boolean = false
    readonly elementA: string
    readonly elementB: string

    hidden: boolean

    private builder: BiomeBuilder
    private renderer: ABBiomeRenderer
    readonly name: string

    private constructor(builder: BiomeBuilder, elementA: string, elementB: string){
        this.elementA = elementA
        this.elementB = elementB
        this.builder = builder
    }

    static create(builder: BiomeBuilder, elementA: string, elementB: string): ABElement{
        const ab_biome = new ABElement(builder, elementA, elementB)
        builder.registerLayoutElement(ab_biome);
        return ab_biome
    }

    lookupKey(temperatureIndex: number, humidityIndex: number): string{
        return this.getKey()
    }

    lookup(temperatureIndex: number, humidityIndex: number): ABElement {
        return this
    }

    lookupRecursive(temperatureIndex: number, humidityIndex: number, mode: Mode, stopAtHidden: boolean = false): LayoutElement {
        let element

        if (mode === "Any"){
            return this
        } else if (mode === "A"){
            element = this.builder.getLayoutElement(this.elementA)
        } else {
            element = this.builder.getLayoutElement(this.elementB)
        }

        if (stopAtHidden && element.hidden)
            return element
        else 
            return element.lookupRecursive(temperatureIndex, humidityIndex, mode, stopAtHidden)
    }

    getElement(mode: "A" | "B"){
        if (mode === "A"){
            return this.builder.getLayoutElement(this.elementA)
        } else {
            return this.builder.getLayoutElement(this.elementB)
        }
    }

    getRenderer(): ElementRenderer {
        if (this.renderer === undefined)
            this.renderer = new ABBiomeRenderer(this)

        return this.renderer
    }

    getKey(){
        return this.elementA + "/" + this.elementB
    }
}